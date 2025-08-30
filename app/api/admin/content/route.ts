import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/content - Starting request...');
    
    const user = await requireAuth(request);
    if (!user) {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);

    const supabase = createAdminClient();
    console.log('🔍 Fetching from content table...');
    
    // Try to fetch from database first
    const { data, error } = await supabase
      .from('content')
      .select('*')
      .single();

    if (error) {
      console.log('⚠️ content table might not exist, using default content:', error.message);
      
      // Return default content if table doesn't exist
      const defaultContent = {
        hero_title_en: 'Welcome to SOULPATH',
        hero_title_es: 'Bienvenido a SOULPATH',
        hero_subtitle_en: 'Your journey to wellness starts here',
        hero_subtitle_es: 'Tu camino al bienestar comienza aquí',
        about_title_en: 'About Us',
        about_title_es: 'Sobre Nosotros',
        about_content_en: 'We are dedicated to helping you achieve your wellness goals.',
        about_content_es: 'Estamos dedicados a ayudarte a alcanzar tus metas de bienestar.'
      };
      
      console.log('✅ Returning default content');
      return NextResponse.json({ content: defaultContent });
    }

    console.log('✅ Content fetched successfully:', data);
    return NextResponse.json({ content: data });
  } catch (error) {
    console.error('❌ Unexpected error in GET /api/admin/content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔍 PUT /api/admin/content - Starting request...');
    
    const user = await requireAuth(request);
    if (!user) {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);
    const body = await request.json();
    console.log('📝 Request body:', body);
    
    const supabase = createAdminClient();
    
    // Try to update the table
    const { data, error } = await supabase
      .from('content')
      .upsert(body, { onConflict: 'id' })
      .single();

    if (error) {
      console.log('⚠️ content table might not exist, cannot update:', error.message);
      return NextResponse.json({ 
        error: 'Content table does not exist. Please run the database setup first.',
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Content updated successfully:', data);
    return NextResponse.json({ content: data });
  } catch (error) {
    console.error('❌ Unexpected error in PUT /api/admin/content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}
