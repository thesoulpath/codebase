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
    const { schedules, startDate, endDate, skipWeekends = false } = body;

    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid schedules data' 
      }, { status: 400 });
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ 
        error: 'Missing startDate or endDate' 
      }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const createdSchedules = [];

    // Generate schedules for each day in the range
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      // Skip weekends if requested
      if (skipWeekends && (date.getDay() === 0 || date.getDay() === 6)) {
        continue;
      }

      const dateStr = date.toISOString().split('T')[0];

      // Create schedules for each time slot
      for (const scheduleTemplate of schedules) {
        if (scheduleTemplate.time) {
          const scheduleData = {
            date: dateStr,
            time: scheduleTemplate.time,
            duration: scheduleTemplate.duration || 60,
            capacity: scheduleTemplate.capacity || 1,
            is_available: scheduleTemplate.isAvailable !== false,
            createdAt: new Date().toISOString()
          };

          const { data: schedule, error } = await supabase
            .from('schedules')
            .insert(scheduleData)
            .select()
            .single();

          if (error) {
            console.error('Error creating schedule:', error);
            continue;
          }

          createdSchedules.push(schedule);
        }
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
