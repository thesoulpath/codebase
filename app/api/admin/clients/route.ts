import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';


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
      .select(`
        *,
        schedules (
          id,
          date,
          time,
          duration,
          isAvailable
        )
      `)
      .order('createdAt', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }

    if (enhanced) {
      // Enhanced response with additional statistics
      const enhancedClients = data?.map((client: any) => {
        const totalBookings = client.schedules?.length || 0;
        const totalDuration = client.schedules?.reduce((sum: number, s: any) => sum + (s.duration || 0), 0) || 0;
        
        return {
          ...client,
          statistics: {
            totalBookings,
            totalDuration,
            averageDuration: totalBookings > 0 ? totalDuration / totalBookings : 0
          }
        };
      });

      return NextResponse.json({ clients: enhancedClients || [] });
    }

    return NextResponse.json({ clients: data || [] });
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
    
    if (!body.email) {
      return NextResponse.json({ 
        error: 'Email is required' 
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
      ...body,
      createdAt: new Date().toISOString()
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

    return NextResponse.json({ client: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
