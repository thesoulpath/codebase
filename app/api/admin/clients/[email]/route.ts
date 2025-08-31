import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = params;
    const body = await request.json();
    
    // Transform camelCase field names to snake_case for database
    const updateData = {
      name: body.name,
      phone: body.phone,
      status: body.status,
      birth_date: body.birthDate,
      birth_time: body.birthTime,
      birth_place: body.birthPlace,
      question: body.question,
      language: body.language,
      admin_notes: body.adminNotes,
      scheduled_date: body.scheduledDate,
      scheduled_time: body.scheduledTime,
      session_type: body.sessionType,
      last_reminder_sent: body.lastReminderSent,
      last_booking: body.lastBooking,
      updated_at: new Date().toISOString()
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    const { data, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('email', email)
      .select()
      .single();

    if (error) {
      console.error('Error updating client:', error);
      return NextResponse.json({ 
        success: false,
        error: 'Failed to update client',
        details: error.message 
      }, { status: 500 });
    }

    // Transform back to camelCase for frontend
    const transformedClient = {
      id: data.id,
      email: data.email,
      name: data.name,
      phone: data.phone,
      status: data.status,
      birthDate: data.birth_date,
      birthTime: data.birth_time,
      birthPlace: data.birth_place,
      question: data.question,
      language: data.language,
      adminNotes: data.admin_notes,
      scheduledDate: data.scheduled_date,
      scheduledTime: data.scheduled_time,
      sessionType: data.session_type,
      lastReminderSent: data.last_reminder_sent,
      lastBooking: data.last_booking,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    return NextResponse.json({ 
      success: true,
      message: 'Client updated successfully',
      client: transformedClient
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = params;

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('email', email);

    if (error) {
      console.error('Error deleting client:', error);
      return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Client deleted successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
