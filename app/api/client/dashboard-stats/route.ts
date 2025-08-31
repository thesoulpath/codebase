import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get the user from the request headers (this should be passed from the client)
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid token',
        message: 'Authentication failed'
      }, { status: 401 });
    }

    console.log('🔍 Fetching dashboard stats for user:', user.email);

    // Get user's bookings count
    const { count: totalBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('client_email', user.email);

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
    }

    // Get user's active packages count
    const { count: activePackages, error: packagesError } = await supabase
      .from('user_packages')
      .select('*', { count: 'exact', head: true })
      .eq('client_email', user.email)
      .eq('status', 'active');

    if (packagesError) {
      console.error('Error fetching packages:', packagesError);
    }

    // Get user's total spent (from payment records)
    const { data: paymentRecords, error: paymentsError } = await supabase
      .from('payment_records')
      .select('amount')
      .eq('client_email', user.email)
      .eq('status', 'completed');

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
    }

    const totalSpent = paymentRecords?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0;

    // Get upcoming sessions count
    const { count: upcomingSessions, error: sessionsError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('client_email', user.email)
      .gte('scheduled_date', new Date().toISOString().split('T')[0]);

    if (sessionsError) {
      console.error('Error fetching upcoming sessions:', sessionsError);
    }

    const stats = {
      totalBookings: totalBookings || 0,
      activePackages: activePackages || 0,
      totalSpent: totalSpent,
      upcomingSessions: upcomingSessions || 0
    };

    console.log('✅ Dashboard stats calculated:', stats);

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Unexpected error in dashboard-stats API:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

