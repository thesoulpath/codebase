import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { clientCreateSchema } from '@/lib/validations';



export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const enhanced = searchParams.get('enhanced') === 'true';

    const supabase = createAdminClient();
    const query = supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }

    if (enhanced) {
      // Enhanced response with additional statistics
                    const enhancedClients = data?.map((client: any) => {
                return {
                  ...client,
                  id: client.id.toString(),
                  createdAt: client.created_at,
                  updatedAt: client.updated_at,
                  totalBookings: 0, // Will be calculated when we have bookings
                  isRecurrent: false, // Will be calculated when we have bookings
                  birthDate: client.birth_date || null,
                  birthTime: client.birth_time || null,
                  birthPlace: client.birth_place || null,
                  question: client.question || null,
                  language: client.language || 'en',
                  adminNotes: client.admin_notes || null
                };
              });

      return NextResponse.json({ 
        success: true,
        clients: enhancedClients || [] 
      });
    }

    return NextResponse.json({ 
      success: true,
      clients: data || [] 
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input data
    const validation = clientCreateSchema.safeParse(body);
    if (!validation.success) {
      const errors = (validation as any).error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`);
      return NextResponse.json({ 
        error: 'Validation failed',
        details: errors.join(', ')
      }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Check if client already exists
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('email', body.email)
      .single();

    if (existingClient) {
      return NextResponse.json({ 
        error: 'Client with this email already exists' 
      }, { status: 409 });
    }

                const clientData = {
              name: body.name,
              email: body.email,
              phone: body.phone || null,
              status: body.status || 'active',
              birth_date: body.birthDate,
              birth_time: body.birthTime || null,
              birth_place: body.birthPlace,
              question: body.question,
              language: body.language || 'en',
              admin_notes: body.adminNotes || null,
              created_at: new Date().toISOString()
            };

    const { data, error } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Client created successfully',
      client: data 
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
