import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/test-payment-records - Starting request...');
    
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
    
    // Test 1: Check if the table exists
    console.log('🔍 Testing if payment_records table exists...');
    const { data: tableExists, error: tableError } = await supabase
      .from('payment_records')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Table check error:', tableError);
      return NextResponse.json({
        success: false,
        error: 'Table check failed',
        message: 'Failed to check payment_records table',
        details: tableError.message
      }, { status: 500 });
    }

    console.log('✅ Table exists, found', tableExists?.length || 0, 'records');

    // Test 2: Check table structure by trying to select specific fields
    console.log('🔍 Testing table structure...');
    const { data: structureTest, error: structureError } = await supabase
      .from('payment_records')
      .select('id, client_email, amount, payment_method, payment_status, created_at')
      .limit(1);

    if (structureError) {
      console.error('❌ Structure test error:', structureError);
      return NextResponse.json({
        success: false,
        error: 'Structure test failed',
        message: 'Failed to test payment_records table structure',
        details: structureError.message
      }, { status: 500 });
    }

    console.log('✅ Structure test successful');

    // Test 3: Try to insert a test record
    console.log('🔍 Testing insert capability...');
    const testRecord = {
      client_email: 'test@example.com',
      amount: 100.00,
      currency_code: 'USD',
      payment_method: 'stripe',
      payment_status: 'pending',
      notes: 'Test record for structure verification'
    };

    const { data: insertTest, error: insertError } = await supabase
      .from('payment_records')
      .insert(testRecord)
      .select();

    if (insertError) {
      console.error('❌ Insert test error:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Insert test failed',
        message: 'Failed to insert test record',
        details: insertError.message,
        tableExists: true,
        structureTest: structureTest
      }, { status: 500 });
    }

    console.log('✅ Insert test successful, created record:', insertTest);

    // Clean up the test record
    if (insertTest && insertTest.length > 0) {
      await supabase
        .from('payment_records')
        .delete()
        .eq('id', insertTest[0].id);
      console.log('✅ Test record cleaned up');
    }

    return NextResponse.json({
      success: true,
      message: 'Payment records table is working correctly',
      tests: {
        tableExists: true,
        structureTest: structureTest,
        insertTest: insertTest
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error in test API:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
