import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Zod schemas for the new unified booking system
const createBookingSchema = z.object({
  client_id: z.number().int().positive('Client ID must be a positive integer'),
  schedule_slot_id: z.number().int().positive('Schedule slot ID must be a positive integer'),
  user_package_id: z.number().int().positive('User package ID must be a positive integer'),
  booking_type: z.enum(['individual', 'group']),
  group_size: z.number().int().positive('Group size must be a positive integer').optional(),
  notes: z.string().optional(),
  total_amount: z.number().min(0, 'Total amount must be non-negative').optional(),
  discount_amount: z.number().min(0, 'Discount amount must be non-negative').default(0),
  final_amount: z.number().min(0, 'Final amount must be non-negative').optional()
});

const updateBookingSchema = z.object({
  id: z.number().int().positive('Booking ID must be a positive integer'),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no-show']).optional(),
  notes: z.string().optional(),
  group_size: z.number().int().positive('Group size must be a positive integer').optional(),
  total_amount: z.number().min(0, 'Total amount must be non-negative').optional(),
  discount_amount: z.number().min(0, 'Discount amount must be non-negative').optional(),
  final_amount: z.number().min(0, 'Final amount must be non-negative').optional(),
  cancelled_at: z.string().optional(),
  cancelled_reason: z.string().optional(),
  reminder_sent: z.boolean().optional()
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const bookingType = searchParams.get('booking_type');
    const packageType = searchParams.get('package_type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build the query for the unified bookings table
    let query = supabase
      .from('bookings')
      .select(`
        *,
        client:clients(
          id,
          name,
          email,
          phone,
          status,
          birth_date,
          birth_time,
          birth_place,
          question,
          language,
          admin_notes,
          created_at,
          updated_at
        ),
        schedule_slot:schedule_slots(
          id,
          start_time,
          end_time,
          capacity,
          booked_count,
          is_available,
          schedule_templates(
            id,
            day_of_week,
            start_time,
            end_time,
            capacity,
            session_durations(
              id,
              name,
              duration_minutes,
              description
            )
          )
        ),
        user_package:user_packages(
          id,
          sessions_remaining,
          sessions_used,
          is_active,
          created_at,
          package_definition:package_definitions(
            id,
            name,
            description,
            sessions_count,
            package_type,
            max_group_size,
            session_durations(
              id,
              name,
              duration_minutes,
              description
            )
          ),
          package_price:package_prices(
            id,
            price,
            pricing_mode,
            currencies(
              id,
              code,
              name,
              symbol,
              exchange_rate
            )
          )
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (clientId && clientId !== 'all') {
      query = query.eq('client_id', clientId);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (dateFrom) {
      query = query.gte('created_at', `${dateFrom}T00:00:00Z`);
    }
    if (dateTo) {
      query = query.lte('created_at', `${dateTo}T23:59:59Z`);
    }
    if (bookingType && bookingType !== 'all') {
      query = query.eq('booking_type', bookingType);
    }
    if (packageType && packageType !== 'all') {
      query = query.eq('user_package.package_definition.package_type', packageType);
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to fetch bookings',
        details: error.message
      }, { status: 500 });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
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
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    const body = await request.json();
    const validation = createBookingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid booking data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const bookingData = validation.data;

    // Validate group size for group bookings
    if (bookingData.booking_type === 'group' && !bookingData.group_size) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Group size is required for group bookings'
      }, { status: 400 });
    }

    // Check if schedule slot exists and has capacity
    const { data: scheduleSlot, error: slotError } = await supabase
      .from('schedule_slots')
      .select('*')
      .eq('id', bookingData.schedule_slot_id)
      .single();

    if (slotError || !scheduleSlot) {
      return NextResponse.json({
        success: false,
        error: 'Schedule slot not found',
        message: 'The specified schedule slot does not exist'
      }, { status: 404 });
    }

    if (!scheduleSlot.is_available) {
      return NextResponse.json({
        success: false,
        error: 'Slot unavailable',
        message: 'This schedule slot is not available for booking'
      }, { status: 400 });
    }

    if (scheduleSlot.booked_count >= scheduleSlot.capacity) {
      return NextResponse.json({
        success: false,
        error: 'Slot full',
        message: 'This schedule slot has no remaining capacity'
      }, { status: 400 });
    }

    // Check if user package exists and has remaining sessions
    const { data: userPackage, error: packageError } = await supabase
      .from('user_packages')
      .select('*')
      .eq('id', bookingData.user_package_id)
      .single();

    if (packageError || !userPackage) {
      return NextResponse.json({
        success: false,
        error: 'User package not found',
        message: 'The specified user package does not exist'
      }, { status: 404 });
    }

    if (!userPackage.is_active) {
      return NextResponse.json({
        success: false,
        error: 'Package inactive',
        message: 'This user package is not active'
      }, { status: 400 });
    }

    if (userPackage.sessions_remaining <= 0) {
      return NextResponse.json({
        success: false,
        error: 'No sessions remaining',
        message: 'This user package has no remaining sessions'
      }, { status: 400 });
    }

    // Calculate final amount if not provided
    let finalAmount = bookingData.final_amount;
    if (!finalAmount && bookingData.total_amount) {
      finalAmount = bookingData.total_amount - (bookingData.discount_amount || 0);
    }

    // Create the booking
    const { data: newBooking, error: createError } = await supabase
      .from('bookings')
      .insert({
        ...bookingData,
        final_amount: finalAmount,
        status: 'pending'
      })
      .select(`
        *,
        client:clients(*),
        schedule_slot:schedule_slots(
          *,
          schedule_templates(
            *,
            session_durations(*)
          )
        ),
        user_package:user_packages(
          *,
          package_definition:package_definitions(
            *,
            session_durations(*)
          ),
          package_price:package_prices(
            *,
            currencies(*)
          )
        )
      `)
      .single();

    if (createError) {
      console.error('Error creating booking:', createError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to create booking',
        details: createError.message
      }, { status: 500 });
    }

    // Update user package sessions
    const { error: updateError } = await supabase
      .from('user_packages')
      .update({
        sessions_remaining: userPackage.sessions_remaining - 1,
        sessions_used: userPackage.sessions_used + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingData.user_package_id);

    if (updateError) {
      console.error('Error updating user package:', updateError);
      // Note: We don't fail the booking creation if this fails
      // The booking is still valid, we just couldn't update the package count
    }

    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      data: newBooking
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateBookingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid booking update data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { id, ...updateData } = validation.data;

    // Check if booking exists
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingBooking) {
      return NextResponse.json({
        success: false,
        error: 'Booking not found',
        message: 'The specified booking does not exist'
      }, { status: 404 });
    }

    // Handle cancellation
    if (updateData.status === 'cancelled' && existingBooking.status !== 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
      
      // Restore session to user package if not already cancelled
      if (existingBooking.user_package_id) {
        // Get current package data to calculate new values
        const { data: currentPackage } = await supabase
          .from('user_packages')
          .select('sessions_remaining, sessions_used')
          .eq('id', existingBooking.user_package_id)
          .single();

        if (currentPackage) {
          const { error: restoreError } = await supabase
            .from('user_packages')
            .update({
              sessions_remaining: currentPackage.sessions_remaining + 1,
              sessions_used: Math.max(currentPackage.sessions_used - 1, 0),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingBooking.user_package_id);

          if (restoreError) {
            console.error('Error restoring user package session:', restoreError);
          }
        }
      }
    }

    // Update the booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        client:clients(*),
        schedule_slot:schedule_slots(
          *,
          schedule_templates(
            *,
            session_durations(*)
          )
        ),
        user_package:user_packages(
          *,
          package_definition:package_definitions(
            *,
            session_durations(*)
          ),
          package_price:package_prices(
            *,
            currencies(*)
          )
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to update booking',
        details: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Booking updated successfully',
      data: updatedBooking
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

export async function DELETE(request: NextRequest) {
  try {
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
        message: 'Booking ID is required'
      }, { status: 400 });
    }

    // Check if booking exists
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingBooking) {
      return NextResponse.json({
        success: false,
        error: 'Booking not found',
        message: 'The specified booking does not exist'
      }, { status: 404 });
    }

    // Restore session to user package if not already cancelled
    if (existingBooking.user_package_id && existingBooking.status !== 'cancelled') {
      // Get current package data to calculate new values
      const { data: currentPackage } = await supabase
        .from('user_packages')
        .select('sessions_remaining, sessions_used')
        .eq('id', existingBooking.user_package_id)
        .single();

      if (currentPackage) {
        const { error: restoreError } = await supabase
          .from('user_packages')
          .update({
            sessions_remaining: currentPackage.sessions_remaining + 1,
            sessions_used: Math.max(currentPackage.sessions_used - 1, 0),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingBooking.user_package_id);

        if (restoreError) {
          console.error('Error restoring user package session:', restoreError);
        }
      }
    }

    // Delete the booking
    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting booking:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to delete booking',
        details: deleteError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Booking deleted successfully'
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
