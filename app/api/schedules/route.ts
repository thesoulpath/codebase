import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Zod schema for schedule creation
const scheduleCreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  duration: z.number().min(30, 'Duration must be at least 30 minutes').max(180, 'Duration cannot exceed 3 hours'),
  capacity: z.number().min(1, 'Capacity must be at least 1').max(10, 'Capacity cannot exceed 10'),
  available: z.boolean().default(true),
  notes: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const available = searchParams.get('available');

    let query = supabase
      .from('schedules')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (date) {
      query = query.eq('date', date);
    }

    if (available !== null) {
      query = query.eq('available', available === 'true');
    }

    const { data: schedules, error } = await query;

    if (error) {
      console.error('Error fetching schedules:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to fetch schedules',
        details: error.message,
        toast: {
          type: 'error',
          title: 'Database Error',
          description: 'Failed to fetch schedules. Please try again.'
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: schedules
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate schedule data
    const validation = scheduleCreateSchema.safeParse(body);
    if (!validation.success) {
      console.error('Validation error:', (validation as any).error.errors);
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Schedule data validation failed',
        details: (validation as any).error.errors,
        toast: {
          type: 'error',
          title: 'Validation Error',
          description: 'Schedule data validation failed. Please check the form fields.'
        }
      }, { status: 400 });
    }

    const scheduleData = validation.data;

    // Check if schedule already exists
    const { data: existingSchedule } = await supabase
      .from('schedules')
      .select('id')
      .eq('date', scheduleData.date)
      .eq('time', scheduleData.time)
      .single();

    if (existingSchedule) {
      return NextResponse.json({
        success: false,
        error: 'Schedule already exists',
        message: 'A schedule already exists for this date and time',
        toast: {
          type: 'error',
          title: 'Schedule Exists',
          description: 'A schedule already exists for this date and time'
        }
      }, { status: 409 });
    }

    // Insert schedule into database
    const { data, error } = await supabase
      .from('schedules')
      .insert({
        date: scheduleData.date,
        time: scheduleData.time,
        duration: scheduleData.duration,
        capacity: scheduleData.capacity,
        available: scheduleData.available,
        notes: scheduleData.notes,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating schedule:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to create schedule',
        details: error.message,
        toast: {
          type: 'error',
          title: 'Schedule Creation Failed',
          description: 'Failed to create schedule. Please try again.'
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Schedule created successfully',
      data,
      toast: {
        type: 'success',
        title: 'Success!',
        description: `Schedule for ${data.date} at ${data.time} created successfully`
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
