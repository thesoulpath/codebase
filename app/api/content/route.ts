import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface NestedContent {
  [key: string]: any;
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

  // Transform the flat Prisma Content model to nested structure
  if (flatContent) {
    // Hero section
    nestedContent.en.hero = {
      title: flatContent.heroTitleEn || 'Welcome to SOULPATH',
      subtitle: flatContent.heroSubtitleEn || 'Your journey to wellness starts here'
    };
    nestedContent.es.hero = {
      title: flatContent.heroTitleEs || 'Bienvenido a SOULPATH',
      subtitle: flatContent.heroSubtitleEs || 'Tu camino al bienestar comienza aquí'
    };

    // About section
    nestedContent.en.about = {
      title: flatContent.aboutTitleEn || 'About Us',
      content: flatContent.aboutContentEn || 'We are dedicated to helping you achieve your wellness goals.'
    };
    nestedContent.es.about = {
      title: flatContent.aboutTitleEs || 'Sobre Nosotros',
      content: flatContent.aboutContentEs || 'Estamos dedicados a ayudarte a alcanzar tus metas de bienestar.'
    };

    // Approach section
    nestedContent.en.approach = {
      title: flatContent.approachTitleEn || 'Our Approach',
      content: flatContent.approachContentEn || 'We use a holistic approach to wellness.'
    };
    nestedContent.es.approach = {
      title: flatContent.approachTitleEs || 'Nuestro Enfoque',
      content: flatContent.approachContentEs || 'Usamos un enfoque holístico para el bienestar.'
    };

    // Services section
    nestedContent.en.services = {
      title: flatContent.servicesTitleEn || 'Our Services',
      content: flatContent.servicesContentEn || 'Professional wellness services in a peaceful environment.'
    };
    nestedContent.es.services = {
      title: flatContent.servicesTitleEs || 'Nuestros Servicios',
      content: flatContent.servicesContentEs || 'Servicios profesionales de bienestar en un ambiente pacífico.'
    };

    // Navigation
    nestedContent.en.nav = {
      invitation: 'Invitation',
      approach: 'Approach',
      session: 'Session',
      about: 'About',
      apply: 'Apply'
    };
    nestedContent.es.nav = {
      invitation: 'Invitación',
      approach: 'Enfoque',
      session: 'Sesión',
      about: 'Acerca de',
      apply: 'Aplicar'
    };

    // CTA buttons
    nestedContent.en.cta = {
      bookReading: 'Book Your Reading'
    };
    nestedContent.es.cta = {
      bookReading: 'Reserva Tu Lectura'
    };
  }

  return nestedContent;
}

export async function GET() {
  try {
    // Get content from the Content table using Prisma
    const content = await prisma.content.findFirst();

    if (!content) {
      console.log('No content found, creating default content');
      // Create default content if none exists
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
      
      const transformedContent = transformFlatContentToNested(defaultContent);
      console.log('✅ Default content created and loaded');
      return NextResponse.json({ content: transformedContent });
    }

    // Transform flat content to nested structure
    const transformedContent = transformFlatContentToNested(content);
    
    console.log('✅ Content loaded from database and transformed');
    return NextResponse.json({ content: transformedContent });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get the first content record or create one
    let content = await prisma.content.findFirst();
    
    if (!content) {
      // Create new content record
      content = await prisma.content.create({
        data: {
          heroTitleEn: body.heroTitleEn || 'Welcome to SOULPATH',
          heroTitleEs: body.heroTitleEs || 'Bienvenido a SOULPATH',
          heroSubtitleEn: body.heroSubtitleEn || 'Your journey to wellness starts here',
          heroSubtitleEs: body.heroSubtitleEs || 'Tu camino al bienestar comienza aquí',
          aboutTitleEn: body.aboutTitleEn || 'About Us',
          aboutTitleEs: body.aboutTitleEs || 'Sobre Nosotros',
          aboutContentEn: body.aboutContentEn || 'We are dedicated to helping you achieve your wellness goals.',
          aboutContentEs: body.aboutContentEs || 'Estamos dedicados a ayudarte a alcanzar tus metas de bienestar.',
          approachTitleEn: body.approachTitleEn || 'Our Approach',
          approachTitleEs: body.approachTitleEs || 'Nuestro Enfoque',
          approachContentEn: body.approachContentEn || 'We use a holistic approach to wellness.',
          approachContentEs: body.approachContentEs || 'Usamos un enfoque holístico para el bienestar.',
          servicesTitleEn: body.servicesTitleEn || 'Our Services',
          servicesTitleEs: body.servicesTitleEs || 'Nuestros Servicios',
          servicesContentEn: body.servicesContentEn || 'Professional wellness services in a peaceful environment.',
          servicesContentEs: body.servicesContentEs || 'Servicios profesionales de bienestar en un ambiente pacífico.'
        }
      });
    } else {
      // Update existing content record
      content = await prisma.content.update({
        where: { id: content.id },
        data: {
          heroTitleEn: body.heroTitleEn,
          heroTitleEs: body.heroTitleEs,
          heroSubtitleEn: body.heroSubtitleEn,
          heroSubtitleEs: body.heroSubtitleEs,
          aboutTitleEn: body.aboutTitleEn,
          aboutTitleEs: body.aboutTitleEs,
          aboutContentEn: body.aboutContentEn,
          aboutContentEs: body.aboutContentEs,
          approachTitleEn: body.approachTitleEn,
          approachTitleEs: body.approachTitleEs,
          approachContentEn: body.approachContentEn,
          approachContentEs: body.approachContentEs,
          servicesTitleEn: body.servicesTitleEn,
          servicesTitleEs: body.servicesTitleEs,
          servicesContentEn: body.servicesContentEn,
          servicesContentEs: body.servicesContentEs
        }
      });
    }

    const transformedContent = transformFlatContentToNested(content);
    return NextResponse.json({ content: transformedContent });
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}
