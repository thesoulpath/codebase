import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = params;

    const supabase = createAdminClient();
    // First get the client ID
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('email', email)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ 
        error: 'Client not found' 
      }, { status: 404 });
    }

    // Get all bookings for this client
    const { data: bookings, error: bookingsError } = await supabase
      .from('schedules')
      .select(`
        *,
        clients (
          id,
          email,
          name,
          phone
        )
      `)
      .eq('clientId', client.id)
      .order('date', { ascending: false });

    if (bookingsError) {
      console.error('Error fetching client bookings:', bookingsError);
      return NextResponse.json({ error: 'Failed to fetch client bookings' }, { status: 500 });
    }

    return NextResponse.json({ 
      bookings: bookings || [],
      client: {
        email,
        id: client.id
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
