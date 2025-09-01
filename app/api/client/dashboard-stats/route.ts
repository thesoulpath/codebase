import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const user = await requireAuth(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get customer ID from user
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, email, created_at')
      .eq('email', user.email)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get total bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, status, created_at, completed_at, rating')
      .eq('customer_id', customer.id);

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    // Get customer packages
    const { data: packages, error: packagesError } = await supabase
      .from('customer_packages')
      .select(`
        id, 
        status, 
        sessions_remaining, 
        total_sessions,
        purchase_date,
        expires_at,
        package_definitions (
          name,
          description,
          session_duration_id
        ),
        package_prices (
          price,
          currencies (
            symbol,
            code
          )
        )
      `)
      .eq('customer_id', customer.id);

    if (packagesError) {
      console.error('Error fetching packages:', packagesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch packages' },
        { status: 500 }
      );
    }

    // Get purchase history
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select(`
        id,
        amount,
        status,
        created_at,
        payment_methods (
          name
        )
      `)
      .eq('customer_id', customer.id);

    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch purchases' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const totalBookings = bookings?.length || 0;
    const completedBookings = bookings?.filter((b: any) => b.status === 'completed').length || 0;
    const upcomingBookings = bookings?.filter((b: any) => 
      b.status === 'confirmed' && new Date(b.created_at) > new Date()
    ).length || 0;
    
    const activePackages = packages?.filter((p: any) => 
      p.status === 'active' && p.sessions_remaining > 0
    ).length || 0;

    const totalSpent = purchases?.reduce((sum: number, purchase: any) => {
      if (purchase.status === 'completed') {
        return sum + (purchase.amount || 0);
      }
      return sum;
    }, 0) || 0;

    const averageRating = bookings?.length > 0 
      ? bookings
          .filter((b: any) => b.rating)
          .reduce((sum: number, b: any) => sum + (b.rating || 0), 0) / 
          bookings.filter((b: any) => b.rating).length
      : 0;

    // Calculate loyalty points (example: 1 point per $10 spent + 1 point per completed booking)
    const loyaltyPoints = Math.floor(totalSpent / 10) + completedBookings;

    const stats = {
      totalBookings,
      activePackages,
      totalSpent,
      upcomingSessions: upcomingBookings,
      completedSessions: completedBookings,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      loyaltyPoints
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error in dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

