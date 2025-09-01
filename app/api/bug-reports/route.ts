import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest) {
  return NextResponse.json({ message: 'Bug reports API is working' });
}

export async function POST(request: NextRequest) {
  try {
    console.log('Bug report API called');
    console.log('Request method:', request.method);
    
    const supabase = await createServerClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('Auth check:', { user: user?.id, error: authError });
    
    if (authError || !user) {
      console.log('Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, screenshot, annotations, category, priority } = body;

    console.log('Received bug report data:', { title, description, category, priority });

    // Validate required fields
    if (!title || !description) {
      console.log('Missing required fields');
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
        annotations,
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
        { error: 'Failed to create bug report: ' + insertError.message },
        { status: 500 }
      );
    }

    console.log('Bug report created successfully:', bugReport);

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
