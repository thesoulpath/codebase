import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Zod schemas
const scheduleTemplateSchema = z.object({
  day_of_week: z.string().min(1, 'Day of week is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  capacity: z.number().int().positive('Capacity must be a positive integer'),
  is_available: z.boolean().default(true),
  session_duration_id: z.number().int().positive().optional(),
  auto_available: z.boolean().default(true)
});

const updateScheduleTemplateSchema = scheduleTemplateSchema.partial().extend({
  id: z.number().int().positive('Schedule template ID must be a positive integer')
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
    const dayOfWeek = searchParams.get('day_of_week');
    const isAvailable = searchParams.get('is_available');
    const sessionDurationId = searchParams.get('session_duration_id');

    // Build the query
    let query = supabase
      .from('schedule_templates')
      .select(`
        *,
        session_durations (
          id,
          name,
          duration_minutes,
          description
        )
      `)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    // Apply filters
    if (dayOfWeek && dayOfWeek !== 'all') {
      query = query.eq('day_of_week', dayOfWeek);
    }
    if (isAvailable !== null && isAvailable !== 'all') {
      query = query.eq('is_available', isAvailable === 'true');
    }
    if (sessionDurationId && sessionDurationId !== 'all') {
      query = query.eq('session_duration_id', sessionDurationId);
    }

    const { data: scheduleTemplates, error } = await query;

    if (error) {
      console.error('Error fetching schedule templates:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to fetch schedule templates',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: scheduleTemplates
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
    const validation = scheduleTemplateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid schedule template data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const templateData = validation.data;

    // Validate time format and logic
    const startTime = templateData.start_time;
    const endTime = templateData.end_time;
    
    if (startTime >= endTime) {
      return NextResponse.json({
        success: false,
        error: 'Invalid time range',
        message: 'Start time must be before end time'
      }, { status: 400 });
    }

    // Check for overlapping templates on the same day
    const { data: overlappingTemplates, error: overlapError } = await supabase
      .from('schedule_templates')
      .select('*')
      .eq('day_of_week', templateData.day_of_week)
      .eq('is_available', true);

    if (overlapError) {
      console.error('Error checking overlapping templates:', overlapError);
    } else if (overlappingTemplates) {
      for (const template of overlappingTemplates) {
        if (
          (startTime >= template.start_time && startTime < template.end_time) ||
          (endTime > template.start_time && endTime <= template.end_time) ||
          (startTime <= template.start_time && endTime >= template.end_time)
        ) {
          return NextResponse.json({
            success: false,
            error: 'Time conflict',
            message: `This time slot conflicts with existing template: ${template.start_time} - ${template.end_time}`
          }, { status: 400 });
        }
      }
    }

    // Create the schedule template
    const { data: newTemplate, error: createError } = await supabase
      .from('schedule_templates')
      .insert(templateData)
      .select(`
        *,
        session_durations (
          id,
          name,
          duration_minutes,
          description
        )
      `)
      .single();

    if (createError) {
      console.error('Error creating schedule template:', createError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to create schedule template',
        details: createError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Schedule template created successfully',
      data: newTemplate
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
    const validation = updateScheduleTemplateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid schedule template update data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { id, ...updateData } = validation.data;

    // Check if template exists
    const { data: existingTemplate, error: checkError } = await supabase
      .from('schedule_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existingTemplate) {
      return NextResponse.json({
        success: false,
        error: 'Template not found',
        message: 'The specified schedule template does not exist'
      }, { status: 404 });
    }

    // Validate time logic if updating time fields
    if (updateData.start_time !== undefined || updateData.end_time !== undefined) {
      const startTime = updateData.start_time ?? existingTemplate.start_time;
      const endTime = updateData.end_time ?? existingTemplate.end_time;
      
      if (startTime >= endTime) {
        return NextResponse.json({
          success: false,
          error: 'Invalid time range',
          message: 'Start time must be before end time'
        }, { status: 400 });
      }

      // Check for overlapping templates (excluding current template)
      const { data: overlappingTemplates, error: overlapError } = await supabase
        .from('schedule_templates')
        .select('*')
        .eq('day_of_week', updateData.day_of_week ?? existingTemplate.day_of_week)
        .eq('is_available', true)
        .neq('id', id);

      if (overlapError) {
        console.error('Error checking overlapping templates:', overlapError);
      } else if (overlappingTemplates) {
        for (const template of overlappingTemplates) {
          if (
            (startTime >= template.start_time && startTime < template.end_time) ||
            (endTime > template.start_time && endTime <= template.end_time) ||
            (startTime <= template.start_time && endTime >= template.end_time)
          ) {
            return NextResponse.json({
              success: false,
              error: 'Time conflict',
              message: `This time slot conflicts with existing template: ${template.start_time} - ${template.end_time}`
            }, { status: 400 });
          }
        }
      }
    }

    // Update the template
    const { data: updatedTemplate, error: updateError } = await supabase
      .from('schedule_templates')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        session_durations (
          id,
          name,
          duration_minutes,
          description
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating schedule template:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to update schedule template',
        details: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Schedule template updated successfully',
      data: updatedTemplate
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
        message: 'Template ID is required'
      }, { status: 400 });
    }

    // Check if template exists
    const { data: existingTemplate, error: checkError } = await supabase
      .from('schedule_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existingTemplate) {
      return NextResponse.json({
        success: false,
        error: 'Template not found',
        message: 'The specified schedule template does not exist'
      }, { status: 404 });
    }

    // Check if template has associated schedule slots
    const { data: scheduleSlots, error: slotsError } = await supabase
      .from('schedule_slots')
      .select('id')
      .eq('schedule_template_id', id)
      .limit(1);

    if (slotsError) {
      console.error('Error checking schedule slots:', slotsError);
    } else if (scheduleSlots && scheduleSlots.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Template in use',
        message: 'Cannot delete template that has associated schedule slots'
      }, { status: 400 });
    }

    // Delete the template
    const { error: deleteError } = await supabase
      .from('schedule_templates')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting schedule template:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to delete schedule template',
        details: deleteError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Schedule template deleted successfully'
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
