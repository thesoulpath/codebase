import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching email templates:', error);
      return NextResponse.json({ error: 'Failed to fetch email templates' }, { status: 500 });
    }

    // Transform the data to match the expected format
    const transformedData = {
      en: {
        subject: data?.en?.subject || '',
        html: data?.en?.html || '',
        videoConferenceLink: {
          isActive: data?.en?.videoConferenceLink?.isActive || false,
          url: data?.en?.videoConferenceLink?.url || '',
          includeInTemplate: data?.en?.videoConferenceLink?.includeInTemplate !== false
        }
      },
      es: {
        subject: data?.es?.subject || '',
        html: data?.es?.html || '',
        videoConferenceLink: {
          isActive: data?.es?.videoConferenceLink?.isActive || false,
          url: data?.es?.videoConferenceLink?.url || '',
          includeInTemplate: data?.es?.videoConferenceLink?.includeInTemplate !== false
        }
      }
    };

    return NextResponse.json({ emailTemplates: transformedData });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const { data, error } = await supabase
      .from('email_templates')
      .upsert(body, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Error updating email templates:', error);
      return NextResponse.json({ error: 'Failed to update email templates' }, { status: 500 });
    }

    return NextResponse.json({ emailTemplates: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
