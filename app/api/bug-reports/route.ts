import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, screenshot, category, priority } = body;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Get user profile
    const { data: _profile } = await supabase
      .from('profiles')
      .select('id, fullName, email')
      .eq('id', user.id)
      .single();

    // Insert bug report
    const { data: bugReport, error: insertError } = await supabase
      .from('bug_reports')
      .insert({
        title,
        description,
        screenshot,
        category,
        priority: priority || 'MEDIUM',
        reporterId: user.id,
        status: 'OPEN'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting bug report:', insertError);
      return NextResponse.json(
        { error: 'Failed to create bug report' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bugReport,
      message: 'Bug report submitted successfully'
    });

  } catch (error) {
    console.error('Error in bug report API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
