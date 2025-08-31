import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Zod schemas
const scheduleSlotSchema = z.object({
  schedule_template_id: z.number().int().positive('Schedule template ID must be a positive integer'),
  start_time: z.string().datetime('Start time must be a valid datetime'),
  end_time: z.string().datetime('End time must be a valid datetime'),
  capacity: z.number().int().positive('Capacity must be a positive integer'),
  booked_count: z.number().int().min(0).default(0),
  is_available: z.boolean().default(true)
});

const updateScheduleSlotSchema = scheduleSlotSchema.partial().extend({
  id: z.number().int().positive('Schedule slot ID must be a positive integer')
});

const generateSlotsSchema = z.object({
  template_ids: z.array(z.number().int().positive()).min(1, 'At least one template ID is required'),
  start_date: z.string().datetime('Start date must be a valid datetime'),
  end_date: z.string().datetime('End date must be a valid datetime'),
  overwrite_existing: z.boolean().default(false)
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
    const templateId = searchParams.get('schedule_template_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const isAvailable = searchParams.get('is_available');
    const hasCapacity = searchParams.get('has_capacity');

    // Build the query
    let query = supabase
      .from('schedule_slots')
      .select(`
        *,
        schedule_templates (
          id,
          day_of_week,
          start_time,
          end_time,
          capacity,
          is_available,
          session_durations (
            id,
            name,
            duration_minutes
          )
        ),
        bookings (
          id,
          client_id,
          status,
          booking_type,
          group_size
        )
      `)
      .order('start_time', { ascending: true });

    // Apply filters
    if (templateId && templateId !== 'all') {
      query = query.eq('schedule_template_id', templateId);
    }
    if (startDate) {
      query = query.gte('start_time', startDate);
    }
    if (endDate) {
      query = query.lte('start_time', endDate);
    }
    if (isAvailable !== null && isAvailable !== 'all') {
      query = query.eq('is_available', isAvailable === 'true');
    }
    if (hasCapacity === 'true') {
      query = query.gt('capacity', 0).gt('capacity', 'booked_count');
    }

    const { data: scheduleSlots, error } = await query;

    if (error) {
      console.error('Error fetching schedule slots:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to fetch schedule slots',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: scheduleSlots
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
    
    // Check if this is a slot generation request
    if (body.action === 'generate_slots') {
      return handleGenerateSlots(body);
    }

    // Regular slot creation
    const validation = scheduleSlotSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid schedule slot data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const slotData = validation.data;

    // Validate time logic
    const startTime = new Date(slotData.start_time);
    const endTime = new Date(slotData.end_time);
    
    if (startTime >= endTime) {
      return NextResponse.json({
        success: false,
        error: 'Invalid time range',
        message: 'Start time must be before end time'
      }, { status: 400 });
    }

    // Check if template exists
    const { data: template, error: templateError } = await supabase
      .from('schedule_templates')
      .select('*')
      .eq('id', slotData.schedule_template_id)
      .single();

    if (templateError || !template) {
      return NextResponse.json({
        success: false,
        error: 'Template not found',
        message: 'The specified schedule template does not exist'
      }, { status: 404 });
    }

    // Check for overlapping slots
    const { data: overlappingSlots, error: overlapError } = await supabase
      .from('schedule_slots')
      .select('*')
      .eq('schedule_template_id', slotData.schedule_template_id)
      .overlaps('start_time', slotData.start_time);

    if (overlapError) {
      console.error('Error checking overlapping slots:', overlapError);
    } else if (overlappingSlots && overlappingSlots.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Time conflict',
        message: 'This time slot conflicts with existing slots'
      }, { status: 400 });
    }

    // Create the schedule slot
    const { data: newSlot, error: createError } = await supabase
      .from('schedule_slots')
      .insert(slotData)
      .select(`
        *,
        schedule_templates (
          id,
          day_of_week,
          start_time,
          end_time,
          capacity,
          is_available,
          session_durations (
            id,
            name,
            duration_minutes
          )
        )
      `)
      .single();

    if (createError) {
      console.error('Error creating schedule slot:', createError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to create schedule slot',
        details: createError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Schedule slot created successfully',
      data: newSlot
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

async function handleGenerateSlots(body: any) {
  try {
    const validation = generateSlotsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid slot generation data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { template_ids, start_date, end_date, overwrite_existing } = validation.data;

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (startDate >= endDate) {
      return NextResponse.json({
        success: false,
        error: 'Invalid date range',
        message: 'Start date must be before end date'
      }, { status: 400 });
    }

    // Get templates
    const { data: templates, error: templatesError } = await supabase
      .from('schedule_templates')
      .select('*')
      .in('id', template_ids)
      .eq('is_available', true);

    if (templatesError || !templates || templates.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Templates not found',
        message: 'No valid templates found for slot generation'
      }, { status: 404 });
    }

    // Delete existing slots if overwrite is enabled
    if (overwrite_existing) {
      const { error: deleteError } = await supabase
        .from('schedule_slots')
        .delete()
        .in('schedule_template_id', template_ids)
        .gte('start_time', start_date)
        .lte('start_time', end_date);

      if (deleteError) {
        console.error('Error deleting existing slots:', deleteError);
      }
    }

    // Generate slots for each template
    const slotsToInsert = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      for (const template of templates) {
        if (template.day_of_week.toLowerCase() === dayOfWeek) {
          const slotStartTime = new Date(currentDate);
          const [startHour, startMinute] = template.start_time.split(':');
          slotStartTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

          const slotEndTime = new Date(currentDate);
          const [endHour, endMinute] = template.end_time.split(':');
          slotEndTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

          // Check if slot already exists
          if (!overwrite_existing) {
            const { data: existingSlot } = await supabase
              .from('schedule_slots')
              .select('id')
              .eq('schedule_template_id', template.id)
              .eq('start_time', slotStartTime.toISOString())
              .single();

            if (existingSlot) continue; // Skip if slot already exists
          }

          slotsToInsert.push({
            schedule_template_id: template.id,
            start_time: slotStartTime.toISOString(),
            end_time: slotEndTime.toISOString(),
            capacity: template.capacity,
            booked_count: 0,
            is_available: template.is_available
          });
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (slotsToInsert.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new slots generated (all slots already exist)',
        data: { slots_generated: 0 }
      });
    }

    // Insert all slots
    const { data: newSlots, error: insertError } = await supabase
      .from('schedule_slots')
      .insert(slotsToInsert)
      .select('*');

    if (insertError) {
      console.error('Error generating schedule slots:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to generate schedule slots',
        details: insertError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${slotsToInsert.length} schedule slots`,
      data: { 
        slots_generated: slotsToInsert.length,
        slots: newSlots
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error generating slots:', error);
    return NextResponse.json({
      success: false,
      error: 'Slot generation failed',
      message: 'An error occurred while generating schedule slots'
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
    const validation = updateScheduleSlotSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid schedule slot update data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { id, ...updateData } = validation.data;

    // Check if slot exists
    const { data: existingSlot, error: checkError } = await supabase
      .from('schedule_slots')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existingSlot) {
      return NextResponse.json({
        success: false,
        error: 'Slot not found',
        message: 'The specified schedule slot does not exist'
      }, { status: 404 });
    }

    // Validate capacity logic
    if (updateData.capacity !== undefined && updateData.capacity < existingSlot.booked_count) {
      return NextResponse.json({
        success: false,
        error: 'Invalid capacity',
        message: `Capacity cannot be less than current booked count (${existingSlot.booked_count})`
      }, { status: 400 });
    }

    // Update the slot
    const { data: updatedSlot, error: updateError } = await supabase
      .from('schedule_slots')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        schedule_templates (
          id,
          day_of_week,
          start_time,
          end_time,
          capacity,
          is_available,
          session_durations (
            id,
            name,
            duration_minutes
          )
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating schedule slot:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to update schedule slot',
        details: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Schedule slot updated successfully',
      data: updatedSlot
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
        message: 'Slot ID is required'
      }, { status: 400 });
    }

    // Check if slot exists
    const { data: existingSlot, error: checkError } = await supabase
      .from('schedule_slots')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existingSlot) {
      return NextResponse.json({
        success: false,
        error: 'Slot not found',
        message: 'The specified schedule slot does not exist'
      }, { status: 404 });
    }

    // Check if slot has bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .eq('schedule_slot_id', id)
      .limit(1);

    if (bookingsError) {
      console.error('Error checking bookings:', bookingsError);
    } else if (bookings && bookings.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Slot in use',
        message: 'Cannot delete slot that has associated bookings'
      }, { status: 400 });
    }

    // Delete the slot
    const { error: deleteError } = await supabase
      .from('schedule_slots')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting schedule slot:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to delete schedule slot',
        details: deleteError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Schedule slot deleted successfully'
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
