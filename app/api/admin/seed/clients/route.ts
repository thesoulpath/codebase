import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clients } = body;

    if (!clients || !Array.isArray(clients) || clients.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid clients data' 
      }, { status: 400 });
    }

    const createdClients = [];

    for (const clientData of clients) {
      try {
        const { data: client, error } = await supabase
          .from('clients')
          .insert({
            email: clientData.email,
            name: clientData.name || 'Unknown',
            phone: clientData.phone || null,
            createdAt: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating client:', error);
          continue;
        }

        createdClients.push(client);
      } catch (error) {
        console.error('Error processing client:', error);
        continue;
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Created ${createdClients.length} clients`,
      clients: createdClients
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
