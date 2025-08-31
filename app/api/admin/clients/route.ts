import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';



// Zod schema for client data
const clientSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional(),
  birthPlace: z.string().min(1, 'Birth place is required'),
  question: z.string().min(1, 'Question is required'),
  language: z.enum(['en', 'es']).default('en'),
  adminNotes: z.string().optional(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional(),
  sessionType: z.string().optional()
});

const updateClientSchema = clientSchema.partial().extend({
  id: z.number().int().positive('Client ID must be a positive integer')
});

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/clients - Starting request...');
    
    // Test environment variables
    console.log('🔍 Environment check:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'
    });
    
    try {
      const user = await requireAuth(request);
      if (!user) {
        console.log('❌ Unauthorized access attempt');
        return NextResponse.json({ 
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required'
        }, { status: 401 });
      }

      console.log('✅ User authenticated:', user.email);
    } catch (authError) {
      console.error('❌ Authentication error:', authError);
      return NextResponse.json({ 
        success: false,
        error: 'Authentication failed',
        message: 'Error during authentication',
        details: authError instanceof Error ? authError.message : 'Unknown auth error'
      }, { status: 500 });
    }
    

    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const status = searchParams.get('status');
    const language = searchParams.get('language');
    const hasActivePackages = searchParams.get('has_active_packages');
    const enhanced = searchParams.get('enhanced') === 'true';

    console.log('🔍 Query parameters:', { email, status, language, hasActivePackages, enhanced });

    // Build the query - only select basic client data without joins
    let query = supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (email) {
      query = query.eq('email', email);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (language) {
      query = query.eq('language', language);
    }

    console.log('🔍 Executing database query...');
    const { data: clients, error } = await query;

    if (error) {
      console.error('❌ Database error in clients API:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to fetch clients',
        details: error.message
      }, { status: 500 });
    }

    console.log('✅ Database query successful, found', clients?.length || 0, 'clients');

    // For now, we'll return basic client data without the relationship counts
    // TODO: Add proper foreign key relationships in the database schema
    let filteredClients = clients;
    
    // Note: hasActivePackages filtering is disabled until we fix the schema
    // if (hasActivePackages === 'true') {
    //   filteredClients = clients.filter(client => 
    //     (client.userPackages as { id: number }[]).length > 0
    //   );
    // } else if (hasActivePackages === 'false') {
    //   filteredClients = clients.filter(client => 
    //     (client.userPackages as { id: number }[]).length === 0
    //   );
    // }

    // If enhanced mode is requested, add additional data
    if (enhanced) {
      console.log('🔍 Enhanced mode requested, returning', filteredClients.length, 'clients');
      // TODO: Add enhanced data when schema is fixed
    }

    console.log('✅ Returning', filteredClients.length, 'clients to client');
    return NextResponse.json({
      success: true,
      data: filteredClients
    });

  } catch (error) {
    console.error('❌ Unexpected error in clients API:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const body = await request.json();
    const validation = clientSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid client data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const clientData = validation.data;

    // Check if client already exists
    const { data: existingClient } = await supabase
      .from('clients')
      .select('email')
      .eq('email', clientData.email)
      .single();

    if (existingClient) {
      return NextResponse.json({
        success: false,
        error: 'Client already exists',
        message: 'A client with this email already exists'
      }, { status: 409 });
    }

    // Create the client
    const { data: newClient, error: createError } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single();

    if (createError) {
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to create client',
        details: createError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Client created successfully',
      data: newClient
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const body = await request.json();
    const validation = updateClientSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid client data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const clientData = validation.data;
    const { id, ...updateData } = clientData;

    // Check if client exists
    const { data: existingClient, error: checkError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existingClient) {
      return NextResponse.json({
        success: false,
        error: 'Client not found',
        message: 'Client with this ID does not exist'
      }, { status: 404 });
    }

    // Update the client
    const { data: updatedClient, error: updateError } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to update client',
        details: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Client updated successfully',
      data: updatedClient
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing ID',
        message: 'Client ID is required'
      }, { status: 400 });
    }

    // Check if client exists
    const { data: existingClient, error: checkError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existingClient) {
      return NextResponse.json({
        success: false,
        error: 'Client not found',
        message: 'Client with this ID does not exist'
      }, { status: 404 });
    }

    // Delete the client
    const { error: deleteError } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to delete client',
        details: deleteError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully'
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

