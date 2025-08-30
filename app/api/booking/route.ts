import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendBookingConfirmation } from '@/lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientEmail, scheduleId, language = 'en' } = body;

    if (!clientEmail || !scheduleId) {
      return NextResponse.json({ 
        error: 'Missing required fields: clientEmail and scheduleId' 
      }, { status: 400 });
    }

    // Get the schedule
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', scheduleId)
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json({ 
        error: 'Schedule not found' 
      }, { status: 404 });
    }

    if (!schedule.is_available) {
      return NextResponse.json({ 
        error: 'Schedule is not available' 
      }, { status: 400 });
    }

    // Check if schedule has capacity
    if (schedule.capacity && schedule.bookedCount && schedule.bookedCount >= schedule.capacity) {
      return NextResponse.json({ 
        error: 'Schedule is at full capacity' 
      }, { status: 400 });
    }

    // Create or update client
    let clientId;
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('email', clientEmail)
      .single();

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          email: clientEmail,
          name: body.clientName || 'Unknown',
          phone: body.clientPhone || null,
          createdAt: new Date().toISOString()
        })
        .select('id')
        .single();

      if (clientError) {
        console.error('Error creating client:', clientError);
        return NextResponse.json({ 
          error: 'Failed to create client' 
        }, { status: 500 });
      }

      clientId = newClient.id;
    }

    // Update schedule
    const { error: updateError } = await supabase
      .from('schedules')
      .update({
        clientId,
        bookedCount: (schedule.bookedCount || 0) + 1,
        updatedAt: new Date().toISOString()
      })
      .eq('id', scheduleId);

    if (updateError) {
      console.error('Error updating schedule:', updateError);
      return NextResponse.json({ 
        error: 'Failed to book schedule' 
      }, { status: 500 });
    }

    // Send confirmation email
    try {
      await sendBookingConfirmation(clientEmail, {
        ...schedule,
        clientName: body.clientName || 'Client'
      }, language);
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the booking if email fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Booking confirmed successfully',
      scheduleId,
      clientId
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
