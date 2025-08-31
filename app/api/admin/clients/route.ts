import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';
import { clientCreateSchema } from '@/lib/validations';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Zod schema for client update
const clientUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  status: z.enum(['active', 'confirmed', 'pending', 'inactive']).optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  birth_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional(),
  birth_place: z.string().min(1, 'Birth place is required').optional(),
  question: z.string().min(10, 'Question must be at least 10 characters').optional(),
  language: z.enum(['en', 'es']).optional(),
  admin_notes: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
        toast: {
          type: 'error',
          title: 'Authentication Failed',
          description: 'You must be logged in to perform this action'
        }
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const language = searchParams.get('language');
    const enhanced = searchParams.get('enhanced') === 'true';
    
    console.log('GET /api/admin/clients - Params:', { page, limit, status, language, enhanced });

    let query = supabase
      .from('clients')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (language) {
      query = query.eq('language', language);
    }

    // If enhanced=true, return all clients without pagination
    if (enhanced) {
      const { data: clients, error, count } = await query
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching clients:', error);
        return NextResponse.json({
          success: false,
          error: 'Database error',
          message: 'Failed to fetch clients',
          details: error.message,
          toast: {
            type: 'error',
            title: 'Database Error',
            description: 'Failed to fetch clients. Please try again.'
          }
        }, { status: 500 });
      }

      // Transform client data for frontend compatibility
      const transformedClients = clients?.map(client => ({
        id: client.id,
        email: client.email,
        name: client.name,
        phone: client.phone,
        status: client.status,
        birthDate: client.birth_date,
        birthTime: client.birth_time,
        birthPlace: client.birth_place,
        question: client.question,
        language: client.language,
        adminNotes: client.admin_notes,
        scheduledDate: client.scheduled_date,
        scheduledTime: client.scheduled_time,
        sessionType: client.session_type,
        lastReminderSent: client.last_reminder_sent,
        lastBooking: client.last_booking,
        createdAt: client.created_at,
        updatedAt: client.updated_at
      })) || [];

      return NextResponse.json({
        success: true,
        data: transformedClients,
        pagination: {
          page: 1,
          limit: count || 0,
          total: count || 0,
          totalPages: 1
        }
      });
    }

    // Regular paginated query
    const { data: clients, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to fetch clients',
        details: error.message,
        toast: {
          type: 'error',
          title: 'Database Error',
          description: 'Failed to fetch clients. Please try again.'
        }
      }, { status: 500 });
    }

    // Transform client data for frontend compatibility
    const transformedClients = clients?.map(client => ({
      id: client.id,
      email: client.email,
      name: client.name,
      phone: client.phone,
      status: client.status,
      birthDate: client.birth_date,
      birthTime: client.birth_time,
      birthPlace: client.birth_place,
      question: client.question,
      language: client.language,
      adminNotes: client.admin_notes,
      scheduledDate: client.scheduled_date,
      scheduledTime: client.scheduled_time,
      sessionType: client.session_type,
      lastReminderSent: client.last_reminder_sent,
      lastBooking: client.last_booking,
      createdAt: client.created_at,
      updatedAt: client.updated_at
    })) || [];

    return NextResponse.json({
      success: true,
      data: transformedClients,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      toast: {
        type: 'error',
        title: 'Unexpected Error',
        description: 'An unexpected error occurred. Please try again.'
      }
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
        message: 'Authentication required',
        toast: {
          type: 'error',
          title: 'Authentication Failed',
          description: 'You must be logged in to perform this action'
        }
      }, { status: 401 });
    }

    const body = await request.json();

    // Validate client data
    const validation = clientCreateSchema.safeParse(body);
    if (!validation.success) {
      console.error('Validation error:', (validation as any).error.errors);
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Client data validation failed',
        details: (validation as any).error.errors,
        toast: {
          type: 'error',
          title: 'Validation Error',
          description: 'Client data validation failed. Please check the form fields.'
        }
      }, { status: 400 });
    }

    const clientData = validation.data;

    // Insert client into database
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        status: clientData.status,
        birth_date: clientData.birthDate,
        birth_time: clientData.birthTime,
        birth_place: clientData.birthPlace,
        question: clientData.question,
        language: clientData.language,
        admin_notes: clientData.adminNotes,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to create client',
        details: error.message,
        toast: {
          type: 'error',
          title: 'Client Creation Failed',
          description: 'Failed to create client. Please try again.'
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Client created successfully',
      client: {
        id: data.id,
        email: data.email,
        name: data.name,
        phone: data.phone,
        status: data.status,
        birthDate: data.birth_date,
        birthTime: data.birth_time,
        birthPlace: data.birth_place,
        question: data.question,
        language: data.language,
        adminNotes: data.admin_notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      },
      toast: {
        type: 'success',
        title: 'Success!',
        description: `Client ${data.name} created successfully`
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      toast: {
        type: 'error',
        title: 'Unexpected Error',
        description: 'An unexpected error occurred. Please try again.'
      }
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
        message: 'Authentication required',
        toast: {
          type: 'error',
          title: 'Authentication Failed',
          description: 'You must be logged in to perform this action'
        }
      }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing ID',
        message: 'Client ID is required for update',
        toast: {
          type: 'error',
          title: 'Missing Information',
          description: 'Client ID is required for update'
        }
      }, { status: 400 });
    }

    // Validate update data
    const validation = clientUpdateSchema.safeParse(updateData);
    if (!validation.success) {
      console.error('Validation error:', (validation as any).error.errors);
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Update data validation failed',
        details: (validation as any).error.errors,
        toast: {
          type: 'error',
          title: 'Validation Error',
          description: 'Update data validation failed. Please check the form fields.'
        }
      }, { status: 400 });
    }

    const validUpdateData = validation.data;

    // Transform data for database
    const dbUpdateData: any = {};
    if (validUpdateData.name !== undefined) dbUpdateData.name = validUpdateData.name;
    if (validUpdateData.email !== undefined) dbUpdateData.email = validUpdateData.email;
    if (validUpdateData.phone !== undefined) dbUpdateData.phone = validUpdateData.phone;
    if (validUpdateData.status !== undefined) dbUpdateData.status = validUpdateData.status;
    if (validUpdateData.birth_date !== undefined) dbUpdateData.birth_date = validUpdateData.birth_date;
    if (validUpdateData.birth_time !== undefined) dbUpdateData.birth_time = validUpdateData.birth_time;
    if (validUpdateData.birth_place !== undefined) dbUpdateData.birth_place = validUpdateData.birth_place;
    if (validUpdateData.question !== undefined) dbUpdateData.question = validUpdateData.question;
    if (validUpdateData.language !== undefined) dbUpdateData.language = validUpdateData.language;
    if (validUpdateData.admin_notes !== undefined) dbUpdateData.admin_notes = validUpdateData.admin_notes;

    dbUpdateData.updated_at = new Date().toISOString();

    // Update client in database
    const { data, error } = await supabase
      .from('clients')
      .update(dbUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating client:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to update client',
        details: error.message,
        toast: {
          type: 'error',
          title: 'Update Failed',
          description: 'Failed to update client. Please try again.'
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Client updated successfully',
      data: {
        id: data.id,
        email: data.email,
        name: data.name,
        phone: data.phone,
        status: data.status,
        birthDate: data.birth_date,
        birthTime: data.birth_time,
        birthPlace: data.birth_place,
        question: data.question,
        language: data.language,
        adminNotes: data.admin_notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      },
      toast: {
        type: 'success',
        title: 'Success!',
        description: `Client ${data.name} updated successfully`
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      toast: {
        type: 'error',
        title: 'Unexpected Error',
        description: 'An unexpected error occurred. Please try again.'
      }
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
        message: 'Authentication required',
        toast: {
          type: 'error',
          title: 'Authentication Failed',
          description: 'You must be logged in to perform this action'
        }
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing ID',
        message: 'Client ID is required for deletion',
        toast: {
          type: 'error',
          title: 'Missing Information',
          description: 'Client ID is required for deletion'
        }
      }, { status: 400 });
    }

    // Delete client from database
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting client:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to delete client',
        details: error.message,
        toast: {
          type: 'error',
          title: 'Deletion Failed',
          description: 'Failed to delete client. Please try again.'
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully',
      toast: {
        type: 'success',
        title: 'Success!',
        description: 'Client deleted successfully'
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      toast: {
        type: 'error',
        title: 'Unexpected Error',
        description: 'An unexpected error occurred. Please try again.'
      }
    }, { status: 500 });
  }
}
