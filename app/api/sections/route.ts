import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ISR Configuration - This route will be statically generated and revalidated
export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  try {
    console.log('🔍 GET /api/sections - Fetching sections...');
    
    // Fetch enabled sections from database, ordered by their order
    const sections = await prisma.section.findMany({
      where: { enabled: true },
      orderBy: { order: 'asc' }
    });

    if (sections.length === 0) {
      console.log('⚠️ No sections found in database, using default sections');
      // Return default sections if none exist in database
      return NextResponse.json({
        sections: [
          {
            id: 'invitation',
            type: 'hero',
            title: 'Invitation',
            description: 'Main landing section with cosmic theme',
            icon: 'Star',
            component: 'HeroSection',
            order: 0,
            enabled: true,
            mobileConfig: {
              padding: 'pt-20 pb-12',
              layout: 'center',
              imageSize: 'large'
            },
            desktopConfig: {
              padding: 'pt-16 pb-20',
              layout: 'center',
              imageSize: 'large'
            }
          },
          {
            id: 'approach',
            type: 'content',
            title: 'Our Approach',
            description: 'How we work and our methodology',
            icon: 'Compass',
            component: 'ApproachSection',
            order: 1,
            enabled: true,
            mobileConfig: {
              padding: 'pt-20 pb-12',
              layout: 'stack',
              imageSize: 'medium'
            },
            desktopConfig: {
              padding: 'pt-16 pb-20',
              layout: 'grid',
              imageSize: 'medium'
            }
          },
          {
            id: 'session',
            type: 'content',
            title: 'Sessions & Services',
            description: 'Available services and session types',
            icon: 'Clock',
            component: 'SessionSection',
            order: 2,
            enabled: true,
            mobileConfig: {
              padding: 'pt-20 pb-12',
              layout: 'stack',
              imageSize: 'medium'
            },
            desktopConfig: {
              padding: 'pt-16 pb-20',
              layout: 'grid',
              imageSize: 'medium'
            }
          },
          {
            id: 'about',
            type: 'content',
            title: 'About SoulPath',
            description: 'Information about José and SoulPath',
            icon: 'User',
            component: 'AboutSection',
            order: 3,
            enabled: true,
            mobileConfig: {
              padding: 'pt-20 pb-12',
              layout: 'stack',
              imageSize: 'large'
            },
            desktopConfig: {
              padding: 'pt-16 pb-20',
              layout: 'grid',
              imageSize: 'large'
            }
          },
          {
            id: 'apply',
            type: 'form',
            title: 'Book Your Session',
            description: 'Booking form and scheduling',
            icon: 'Calendar',
            component: 'BookingSection',
            order: 4,
            enabled: true,
            mobileConfig: {
              padding: 'pt-20 pb-12',
              layout: 'center',
              imageSize: 'small'
            },
            desktopConfig: {
              padding: 'pt-16 pb-20',
              layout: 'center',
              imageSize: 'small'
            }
          }
        ]
      });
    }

    console.log('✅ Sections loaded from database and transformed');
    
    // Transform database sections to match the expected format
    const transformedSections = sections.map(section => ({
      id: section.sectionId,
      type: section.type,
      title: section.title,
      description: section.description,
      icon: section.icon,
      component: section.component,
      order: section.order,
      enabled: section.enabled,
      mobileConfig: section.mobileConfig || {},
      desktopConfig: section.desktopConfig || {}
    }));

    return NextResponse.json({ sections: transformedSections });

  } catch (error) {
    console.error('❌ Error in GET /api/sections:', error);
    
    // Return default sections on error
    return NextResponse.json({
      sections: [
        {
          id: 'invitation',
          type: 'hero',
          title: 'Invitation',
          description: 'Main landing section with cosmic theme',
          icon: 'Star',
          component: 'HeroSection',
          order: 0,
          enabled: true
        }
      ]
    });
  }
}
