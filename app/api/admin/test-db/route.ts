import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const { error: testError } = await supabase
      .from('clients')
      .select('count')
      .limit(1);
      
    if (testError) {
      console.error('Database connection test failed:', testError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: testError.message
      }, { status: 500 });
    }
    
    // Test getting total count
    const { count, error: countError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error('Count test failed:', countError);
      return NextResponse.json({
        success: false,
        error: 'Count test failed',
        details: countError.message
      }, { status: 500 });
    }
    
    // Test getting a few clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, email, status')
      .limit(5);
      
    if (clientsError) {
      console.error('Clients fetch test failed:', clientsError);
      return NextResponse.json({
        success: false,
        error: 'Clients fetch test failed',
        details: clientsError.message
      }, { status: 500 });
    }
    
    console.log('Database test successful:', { count, sampleClients: clients });
    
    return NextResponse.json({
      success: true,
      message: 'Database connection test successful',
      data: {
        totalClients: count,
        sampleClients: clients,
        connectionStatus: 'OK'
      }
    });
    
  } catch (error) {
    console.error('Unexpected error in database test:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      message: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
