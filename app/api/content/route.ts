import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface NestedContent {
  [key: string]: any; // Allow string indexing
}

interface TransformedContent {
  en: NestedContent;
  es: NestedContent;
}

function transformFlatContentToNested(flatContent: any): TransformedContent {
  const nestedContent: TransformedContent = {
    en: {} as NestedContent,
    es: {} as NestedContent
  };

  // Get all keys that don't include metadata
  const keys = Object.keys(flatContent).filter(key =>
    !key.includes('created_at') && !key.includes('updated_at') && !key.includes('id')
  );

  // Process each key
  keys.forEach(key => {
    if (key.endsWith('_en')) {
      const baseKey = key.replace('_en', '');
      if (!nestedContent.en[baseKey]) {
        nestedContent.en[baseKey] = {};
      }
      nestedContent.en[baseKey] = flatContent[key];
    } else if (key.endsWith('_es')) {
      const baseKey = key.replace('_es', '');
      if (!nestedContent.es[baseKey]) {
        nestedContent.es[baseKey] = {};
      }
      nestedContent.es[baseKey] = flatContent[key];
    }
  });

  // Handle special nested structures for hero, about, approach, services
  const specialKeys = ['hero', 'about', 'approach', 'services'];
  specialKeys.forEach(specialKey => {
    if (nestedContent.en[specialKey + '_title']) {
      nestedContent.en[specialKey] = {
        title: nestedContent.en[specialKey + '_title'],
        subtitle: nestedContent.en[specialKey + '_subtitle'] || '',
        content: nestedContent.en[specialKey + '_content'] || ''
      };
      // Clean up the flat keys
      delete nestedContent.en[specialKey + '_title'];
      delete nestedContent.en[specialKey + '_subtitle'];
      delete nestedContent.en[specialKey + '_content'];
    }
    
    if (nestedContent.es[specialKey + '_title']) {
      nestedContent.es[specialKey] = {
        title: nestedContent.es[specialKey + '_title'],
        subtitle: nestedContent.es[specialKey + '_subtitle'] || '',
        content: nestedContent.es[specialKey + '_content'] || ''
      };
      // Clean up the flat keys
      delete nestedContent.es[specialKey + '_subtitle'];
      delete nestedContent.es[specialKey + '_content'];
    }
  });

  return nestedContent;
}

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

    // Fallback to content table (flat structure) and transform it
    const { data, error } = await supabase
      .from('content')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching content:', error);
      return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
    }

    // Transform flat content to nested structure
    const transformedContent = transformFlatContentToNested(data);
    
    console.log('✅ Content loaded from content table and transformed');
    return NextResponse.json({ content: transformedContent });
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
