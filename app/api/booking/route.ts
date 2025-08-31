import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Zod schema for booking creation
const bookingCreateSchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
  schedule_id: z.string().uuid('Invalid schedule ID'),
  notes: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled']).default('pending')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate booking data
    const validation = bookingCreateSchema.safeParse(body);
    if (!validation.success) {
      console.error('Validation error:', (validation as any).error.errors);
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Booking data validation failed',
        details: (validation as any).error.errors,
        toast: {
          type: 'error',
          title: 'Validation Error',
          description: 'Booking data validation failed. Please check the form fields.'
        }
      }, { status: 400 });
    }

    const bookingData = validation.data;

    // Check if client exists
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', bookingData.client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({
        success: false,
        error: 'Client not found',
        message: 'The specified client does not exist',
        toast: {
          type: 'error',
          title: 'Client Not Found',
          description: 'The specified client does not exist'
        }
      }, { status: 404 });
    }

    // Check if schedule exists and is available
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .select('id, date, time, available, capacity')
      .eq('id', bookingData.schedule_id)
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json({
        success: false,
        error: 'Schedule not found',
        message: 'The specified schedule does not exist',
        toast: {
          type: 'error',
          title: 'Schedule Not Found',
          description: 'The specified schedule does not exist'
        }
      }, { status: 404 });
    }

    if (!schedule.available) {
      return NextResponse.json({
        success: false,
        error: 'Schedule unavailable',
        message: 'The specified schedule is not available',
        toast: {
          type: 'error',
          title: 'Schedule Unavailable',
          description: 'The specified schedule is not available'
        }
      }, { status: 400 });
    }

    // Check current bookings for this schedule
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .eq('schedule_id', bookingData.schedule_id)
      .eq('status', 'confirmed');

    if (bookingsError) {
      console.error('Error checking existing bookings:', bookingsError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to check schedule availability',
        details: bookingsError.message,
        toast: {
          type: 'error',
          title: 'Database Error',
          description: 'Failed to check schedule availability. Please try again.'
        }
      }, { status: 500 });
    }

    if (existingBookings && existingBookings.length >= schedule.capacity) {
      return NextResponse.json({
        success: false,
        error: 'Schedule full',
        message: 'The specified schedule is at full capacity',
        toast: {
          type: 'error',
          title: 'Schedule Full',
          description: 'The specified schedule is at full capacity'
        }
      }, { status: 400 });
    }

    // Create booking
    const { data: booking, error: createError } = await supabase
      .from('bookings')
      .insert({
        client_id: bookingData.client_id,
        schedule_id: bookingData.schedule_id,
        notes: bookingData.notes,
        status: bookingData.status,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating booking:', createError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to create booking',
        details: createError.message,
        toast: {
          type: 'error',
          title: 'Booking Creation Failed',
          description: 'Failed to create booking. Please try again.'
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      data: booking,
      toast: {
        type: 'success',
        title: 'Success!',
        description: `Booking created for ${client.name} on ${schedule.date} at ${schedule.time}`
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      toast: {
        type: 'error',
        title: 'Unexpected Error',
        description: 'An unexpected error occurred. Please try again.'
      }
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');
    const scheduleId = searchParams.get('schedule_id');

    let query = supabase
      .from('bookings')
      .select(`
        *,
        clients (
          id,
          name,
          email
        ),
        schedules (
          id,
          date,
          time
        )
      `);

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (scheduleId) {
      query = query.eq('schedule_id', scheduleId);
    }

    const { data: bookings, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to fetch bookings',
        details: error.message,
        toast: {
          type: 'error',
          title: 'Database Error',
          description: 'Failed to fetch bookings. Please try again.'
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: bookings
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      toast: {
        type: 'error',
        title: 'Unexpected Error',
        description: 'An unexpected error occurred. Please try again.'
      }
    }, { status: 500 });
  }
}
