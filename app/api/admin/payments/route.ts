import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/payments - Starting request...');
    
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
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const clientEmail = searchParams.get('clientEmail');
    const paymentMethod = searchParams.get('paymentMethod');
    const paymentStatus = searchParams.get('paymentStatus');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const amountMin = searchParams.get('amountMin');
    const amountMax = searchParams.get('amountMax');

    console.log('🔍 Query parameters:', { 
      page, limit, clientEmail, paymentMethod, paymentStatus, 
      dateFrom, dateTo, amountMin, amountMax 
    });

    // Build the query
    let query = supabase
      .from('payment_records')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (clientEmail) {
      query = query.eq('client_email', clientEmail);
    }
    if (paymentMethod && paymentMethod !== 'all') {
      query = query.eq('payment_method', paymentMethod);
    }
    if (paymentStatus && paymentStatus !== 'all') {
      query = query.eq('payment_status', paymentStatus);
    }
    if (dateFrom) {
      query = query.gte('payment_date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('payment_date', dateTo);
    }
    if (amountMin) {
      query = query.gte('amount', parseFloat(amountMin));
    }
    if (amountMax) {
      query = query.lte('amount', parseFloat(amountMax));
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('payment_records')
      .select('*', { count: 'exact', head: true });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    console.log('🔍 Executing database query...');
    const { data: paymentRecords, error } = await query;

    if (error) {
      console.error('❌ Database error in payments API:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to fetch payment records',
        details: error.message
      }, { status: 500 });
    }

    console.log('✅ Database query successful, found', paymentRecords?.length || 0, 'payment records');

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: paymentRecords || [],
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error in payments API:', error);
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
    console.log('🔍 POST /api/admin/payments - Starting request...');
    
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    const body = await request.json();
    console.log('🔍 Request body:', body);

    // Create the payment record
    const { data: newPaymentRecord, error: createError } = await supabase
      .from('payment_records')
      .insert(body)
      .select()
      .single();

    if (createError) {
      console.error('❌ Database error creating payment record:', createError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to create payment record',
        details: createError.message
      }, { status: 500 });
    }

    console.log('✅ Payment record created successfully:', newPaymentRecord);

    return NextResponse.json({
      success: true,
      message: 'Payment record created successfully',
      data: newPaymentRecord
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Unexpected error in payments POST API:', error);
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
    console.log('🔍 PUT /api/admin/payments - Starting request...');
    
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing ID',
        message: 'Payment record ID is required'
      }, { status: 400 });
    }

    console.log('🔍 Updating payment record:', { id, updateData });

    // Update the payment record
    const { data: updatedPaymentRecord, error: updateError } = await supabase
      .from('payment_records')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Database error updating payment record:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to update payment record',
        details: updateError.message
      }, { status: 500 });
    }

    console.log('✅ Payment record updated successfully:', updatedPaymentRecord);

    return NextResponse.json({
      success: true,
      message: 'Payment record updated successfully',
      data: updatedPaymentRecord
    });

  } catch (error) {
    console.error('❌ Unexpected error in payments PUT API:', error);
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
    console.log('🔍 DELETE /api/admin/payments - Starting request...');
    
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing ID',
        message: 'Payment record ID is required'
      }, { status: 400 });
    }

    console.log('🔍 Deleting payment record:', id);

    // Delete the payment record
    const { error: deleteError } = await supabase
      .from('payment_records')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ Database error deleting payment record:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to delete payment record',
        details: deleteError.message
      }, { status: 500 });
    }

    console.log('✅ Payment record deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Payment record deleted successfully'
    });

  } catch (error) {
    console.error('❌ Unexpected error in payments DELETE API:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
