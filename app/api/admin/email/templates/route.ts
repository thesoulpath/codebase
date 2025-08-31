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
      .select('*');

    if (error) {
      console.error('Error fetching email templates:', error);
      return NextResponse.json({ error: 'Failed to fetch email templates' }, { status: 500 });
    }

    // Transform the data to match the expected format
    // Group templates by language and template key
    const transformedData: any = {};
    
    if (data && data.length > 0) {
      data.forEach((template: any) => {
        const lang = template.language || 'en';
        const key = template.templateKey;
        
        if (!transformedData[lang]) {
          transformedData[lang] = {};
        }
        
        transformedData[lang][key] = {
          subject: template.subject || '',
          html: template.body || '',
          videoConferenceLink: {
            isActive: false,
            url: '',
            includeInTemplate: false
          }
        };
      });
    }

    return NextResponse.json({ templates: transformedData });
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
    const { templates } = body;
    
    if (!templates) {
      return NextResponse.json({ error: 'Templates data is required' }, { status: 400 });
    }

    // Convert the nested structure to flat rows for the email_templates table
    const templateRows: Array<{
      template_key: string;
      language: string;
      subject: string;
      body: string;
    }> = [];
    
    Object.entries(templates).forEach(([lang, langTemplates]: [string, any]) => {
      Object.entries(langTemplates).forEach(([key, template]: [string, any]) => {
        templateRows.push({
          template_key: key,
          language: lang,
          subject: template.subject || '',
          body: template.html || ''
        });
      });
    });

    // Delete existing templates and insert new ones
    const { error: deleteError } = await supabase
      .from('email_templates')
      .delete()
      .neq('id', 0); // Delete all rows

    if (deleteError) {
      console.error('Error deleting existing templates:', deleteError);
      return NextResponse.json({ error: 'Failed to update email templates' }, { status: 500 });
    }

    if (templateRows.length > 0) {
      const { error: insertError } = await supabase
        .from('email_templates')
        .insert(templateRows)
        .select();

      if (insertError) {
        console.error('Error inserting new templates:', insertError);
        return NextResponse.json({ error: 'Failed to update email templates' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Templates updated successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
