import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized',
        message: 'Authentication required' 
      }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    // Build the query for unified bookings
    let query = supabase
      .from('bookings')
      .select(`
        *,
        unifiedClient:clientId(
          id,
          name,
          email
        ),
        scheduleSlot:scheduleSlotId(
          id,
          startTime,
          endTime
        ),
        unifiedUserPackage:userPackageId(
          id,
          packagePrice(
            id,
            packageDefinition(
              id,
              name,
              description,
              packageType
            ),
            currency(
              id,
              code,
              symbol
            )
          )
        )
      `)
      .eq('clientEmail', user.email);

    // Filter by status if specified
    if (status === 'upcoming') {
      query = query
        .gte('booking_date', new Date().toISOString().split('T')[0])
        .eq('status', 'confirmed');
    } else if (status === 'past') {
      query = query
        .lt('booking_date', new Date().toISOString().split('T')[0])
        .eq('status', 'completed');
    }

    // Order by date
    query = query.order('booking_date', { ascending: status === 'upcoming' });

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Database error',
        message: 'Failed to fetch bookings' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: bookings,
      message: 'Bookings fetched successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      message: 'An unexpected error occurred' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized',
        message: 'Authentication required' 
      }, { status: 401 });
    }

    const body = await request.json();
    const {
      schedule_slot_id,
      user_package_id,
      booking_type,
      group_size,
      notes
    } = body;

    // Validation
    if (!schedule_slot_id || !user_package_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'Schedule slot and user package are required'
      }, { status: 400 });
    }

    // Verify the user owns the package
    const { data: userPackage, error: packageError } = await supabase
      .from('user_packages')
      .select('*')
      .eq('id', user_package_id)
      .eq('client_email', user.email)
      .eq('is_active', true)
      .single();

    if (packageError || !userPackage) {
      return NextResponse.json({
        success: false,
        error: 'Invalid package',
        message: 'Package not found or not active'
      }, { status: 400 });
    }

    // Verify the schedule slot is available
    const { data: scheduleSlot, error: slotError } = await supabase
      .from('schedule_slots')
      .select('*')
      .eq('id', schedule_slot_id)
      .eq('is_available', true)
      .single();

    if (slotError || !scheduleSlot) {
      return NextResponse.json({
        success: false,
        error: 'Invalid schedule slot',
        message: 'Schedule slot not found or not available'
      }, { status: 400 });
    }

    // Check if slot has capacity
    if (scheduleSlot.booked_count >= scheduleSlot.capacity) {
      return NextResponse.json({
        success: false,
        error: 'Slot full',
        message: 'This time slot is already full'
      }, { status: 400 });
    }

    // Create the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        client_email: user.email,
        schedule_slot_id: schedule_slot_id,
        user_package_id: user_package_id,
        booking_type: booking_type || 'individual',
        group_size: booking_type === 'group' ? group_size : undefined,
        notes: notes || undefined,
        status: 'pending',
        booking_date: scheduleSlot.start_time.split('T')[0],
        session_time: scheduleSlot.start_time.split('T')[1] || '00:00:00',
        session_type: 'Session'
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to create booking'
      }, { status: 500 });
    }

    // Update the schedule slot booked count
    await supabase
      .from('schedule_slots')
      .update({ booked_count: scheduleSlot.booked_count + 1 })
      .eq('id', schedule_slot_id);

    return NextResponse.json({
      success: true,
      data: booking,
      message: 'Booking created successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      message: 'An unexpected error occurred' 
    }, { status: 500 });
  }
}
