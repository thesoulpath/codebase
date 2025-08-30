import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const available = searchParams.get('available') === 'true';

    let query = supabase
      .from('schedules')
      .select('*');

    if (date) {
      query = query.eq('date', date);
    }

    if (available) {
      query = query.eq('is_available', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching schedules:', error);
      return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
    }

    // Transform the data to match frontend expectations
    const transformedData = (data || []).map(schedule => ({
      ...schedule,
      isAvailable: schedule.is_available,
      // Add missing fields with defaults for frontend compatibility
      date: schedule.date || schedule.day_of_week,
      time: schedule.time || schedule.start_time,
      capacity: schedule.capacity || 1,
      bookedCount: schedule.bookedCount || 0,
      clientId: schedule.clientId || null
    }));

    return NextResponse.json({ schedules: transformedData });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const { data, error } = await supabase
      .from('schedules')
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error('Error creating schedule:', error);
      return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
    }

    return NextResponse.json({ schedule: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
