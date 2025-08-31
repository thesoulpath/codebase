import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log('Debug: Fetching all clients from database...');
    
    // Get all clients with all fields
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch clients',
        details: error.message
      }, { status: 500 });
    }
    
    console.log('Debug: Found clients:', clients);
    
    // Group by status for easier analysis
    const statusCounts = clients.reduce((acc, client) => {
      acc[client.status] = (acc[client.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return NextResponse.json({
      success: true,
      message: 'Client debug information',
      data: {
        totalClients: clients.length,
        statusCounts,
        allClients: clients.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          status: c.status,
          birth_date: c.birth_date,
          birth_time: c.birth_time,
          birth_place: c.birth_place,
          language: c.language,
          created_at: c.created_at,
          updated_at: c.updated_at
        }))
      }
    });
    
  } catch (error) {
    console.error('Unexpected error in debug clients:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      message: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
