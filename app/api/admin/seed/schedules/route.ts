import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { schedules } = body;

    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid schedules data' 
      }, { status: 400 });
    }

    const createdSchedules = [];

    for (const scheduleData of schedules) {
      try {
        const { data: schedule, error } = await supabase
          .from('schedules')
          .insert({
            date: scheduleData.date,
            time: scheduleData.time,
            duration: scheduleData.duration || 60,
            capacity: scheduleData.capacity || 1,
            is_available: scheduleData.isAvailable !== false,
            createdAt: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating schedule:', error);
          continue;
        }

        createdSchedules.push(schedule);
      } catch (error) {
        console.error('Error processing schedule:', error);
        continue;
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Created ${createdSchedules.length} schedules`,
      schedules: createdSchedules
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
