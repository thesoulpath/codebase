import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // First try to get content from kv_store (this has the nested structure)
    const { data: kvData, error: kvError } = await supabase
      .from('kv_store_f839855f')
      .select('*')
      .eq('key', 'cms_content')
      .single();

    if (!kvError && kvData?.value) {
      console.log('✅ Content loaded from kv_store');
      return NextResponse.json({ content: kvData.value });
    }

    // Fallback to content table (flat structure)
    const { data, error } = await supabase
      .from('content')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching content:', error);
      return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
    }

    console.log('✅ Content loaded from content table');
    return NextResponse.json({ content: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('content')
      .upsert(body, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Error updating content:', error);
      return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
    }

    return NextResponse.json({ content: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
