import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';

// GET - List all session durations
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerClient();

    const { data: sessionDurations, error } = await supabase
      .from('session_durations')
      .select('*')
      .order('duration_minutes');

    if (error) {
      console.error('Error fetching session durations:', error);
      return NextResponse.json({ error: 'Failed to fetch session durations' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: sessionDurations
    });

  } catch (error) {
    console.error('Error in GET /api/admin/session-durations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new session duration
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerClient();

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.duration_minutes) {
      return NextResponse.json({ error: 'Name and duration are required' }, { status: 400 });
    }

    // Create new session duration
    const { data: newSessionDuration, error } = await supabase
      .from('session_durations')
      .insert({
        name: body.name,
        description: body.description || null,
        duration_minutes: body.duration_minutes,
        is_active: body.is_active !== undefined ? body.is_active : true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session duration:', error);
      return NextResponse.json({ error: 'Failed to create session duration' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: newSessionDuration,
      message: 'Session duration created successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/admin/session-durations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
