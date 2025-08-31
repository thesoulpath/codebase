import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    console.log('🔍 Debug endpoint - Testing database connection...');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    console.log('🔍 Supabase client created');
    console.log('🔍 Environment variables:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'
    });

    // Test basic connection
    const { error: testError } = await supabase
      .from('clients')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Database test failed:', testError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: testError.message,
        code: testError.code
      }, { status: 500 });
    }

    console.log('✅ Database connection successful');
    
    // Test table structure
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(5);

    if (clientsError) {
      console.error('❌ Clients table query failed:', clientsError);
      return NextResponse.json({
        success: false,
        error: 'Clients table query failed',
        details: clientsError.message,
        code: clientsError.code
      }, { status: 500 });
    }

    console.log('✅ Clients table query successful, found', clients?.length || 0, 'clients');

    return NextResponse.json({
      success: true,
      message: 'Database connection and table access working',
      clientCount: clients?.length || 0,
      sampleClient: clients?.[0] || null
    });

  } catch (error) {
    console.error('❌ Unexpected error in debug endpoint:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
