import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/content - Starting request...');
    
    const user = await requireAuth(request);
    if (!user) {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);

    console.log('🔍 Fetching from content table...');
    
    // Try to fetch from database first
    try {
      const content = await prisma.content.findFirst();
      
      if (content) {
        console.log('✅ Content fetched successfully:', content);
        return NextResponse.json({ content: content });
      } else {
        console.log('⚠️ No content found, creating default content...');
        
        // Create default content
        const defaultContent = await prisma.content.create({
          data: {
            heroTitleEn: 'Welcome to SOULPATH',
            heroTitleEs: 'Bienvenido a SOULPATH',
            heroSubtitleEn: 'Your journey to wellness starts here',
            heroSubtitleEs: 'Tu camino al bienestar comienza aquí',
            aboutTitleEn: 'About Us',
            aboutTitleEs: 'Sobre Nosotros',
            aboutContentEn: 'We are dedicated to helping you achieve your wellness goals.',
            aboutContentEs: 'Estamos dedicados a ayudarte a alcanzar tus metas de bienestar.',
            approachTitleEn: 'Our Approach',
            approachTitleEs: 'Nuestro Enfoque',
            approachContentEn: 'We use a holistic approach to wellness.',
            approachContentEs: 'Usamos un enfoque holístico para el bienestar.',
            servicesTitleEn: 'Our Services',
            servicesTitleEs: 'Nuestros Servicios',
            servicesContentEn: 'Professional wellness services in a peaceful environment.',
            servicesContentEs: 'Servicios profesionales de bienestar en un ambiente pacífico.'
          }
        });
        
        console.log('✅ Default content created:', defaultContent);
        return NextResponse.json({ content: defaultContent });
      }
    } catch (error) {
      console.log('⚠️ Error accessing content table:', error);
      
      // Return default content if table doesn't exist
      const defaultContent = {
        heroTitleEn: 'Welcome to SOULPATH',
        heroTitleEs: 'Bienvenido a SOULPATH',
        heroSubtitleEn: 'Your journey to wellness starts here',
        heroSubtitleEs: 'Tu camino al bienestar comienza aquí',
        aboutTitleEn: 'About Us',
        aboutTitleEs: 'Sobre Nosotros',
        aboutContentEn: 'We are dedicated to helping you achieve your wellness goals.',
        aboutContentEs: 'Estamos dedicados a ayudarte a alcanzar tus metas de bienestar.',
        approachTitleEn: 'Our Approach',
        approachTitleEs: 'Nuestro Enfoque',
        approachContentEn: 'We use a holistic approach to wellness.',
        approachContentEs: 'Usamos un enfoque holístico para el bienestar.',
        servicesTitleEn: 'Our Services',
        servicesTitleEs: 'Nuestros Servicios',
        servicesContentEn: 'Professional wellness services in a peaceful environment.',
        servicesContentEs: 'Servicios profesionales de bienestar en un ambiente pacífico.'
      };
      
      console.log('✅ Returning default content');
      return NextResponse.json({ content: defaultContent });
    }
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
    
    // Try to update the table
    try {
      const { content } = body;
      
      // Validate required fields
      const requiredFields = [
        'heroTitleEn', 'heroTitleEs', 'heroSubtitleEn', 'heroSubtitleEs',
        'aboutTitleEn', 'aboutTitleEs', 'aboutContentEn', 'aboutContentEs',
        'approachTitleEn', 'approachTitleEs', 'approachContentEn', 'approachContentEs',
        'servicesTitleEn', 'servicesTitleEs', 'servicesContentEn', 'servicesContentEs'
      ];
      
      const missingFields = requiredFields.filter(field => !content[field]);
      if (missingFields.length > 0) {
        console.log('❌ Missing required fields:', missingFields);
        return NextResponse.json({ 
          error: 'Missing required fields',
          missingFields 
        }, { status: 400 });
      }
      
      // Find existing content or create new
      let existingContent = await prisma.content.findFirst();
      
      if (existingContent) {
        // Update existing content
        const updatedContent = await prisma.content.update({
          where: { id: existingContent.id },
          data: content
        });
        
        console.log('✅ Content updated successfully:', updatedContent);
        
        // Trigger comprehensive revalidation
        await triggerRevalidation();
        
        return NextResponse.json({ content: updatedContent });
      } else {
        // Create new content
        const newContent = await prisma.content.create({
          data: content
        });
        
        console.log('✅ Content created successfully:', newContent);
        
        // Trigger comprehensive revalidation
        await triggerRevalidation();
        
        return NextResponse.json({ content: newContent });
      }
    } catch (error) {
      console.log('⚠️ Error updating content:', error);
      return NextResponse.json({ 
        error: 'Failed to update content. Please check the database connection.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Unexpected error in PUT /api/admin/content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}

// Helper function to trigger comprehensive revalidation
async function triggerRevalidation() {
  try {
    console.log('🔄 Triggering comprehensive revalidation...');
    
    // Revalidate all static pages that use this content
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/api/content');
    
    // Revalidate content-related tags
    revalidateTag('content');
    revalidateTag('translations');
    revalidateTag('sections');
    
    // Also trigger the revalidation API for additional pages
    try {
      const revalResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/revalidate?path=/&tag=content`, {
        method: 'POST'
      });
      
      if (revalResponse.ok) {
        console.log('✅ Additional revalidation triggered successfully');
      } else {
        console.log('⚠️ Additional revalidation failed, but core revalidation succeeded');
      }
    } catch (revalError) {
      console.log('⚠️ Additional revalidation failed, but core revalidation succeeded:', revalError);
    }
    
    console.log('✅ Comprehensive revalidation completed');
  } catch (error) {
    console.error('❌ Error during revalidation:', error);
    // Don't fail the request if revalidation fails
  }
}
