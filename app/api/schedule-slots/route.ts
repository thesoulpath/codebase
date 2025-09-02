import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/schedule-slots - Fetching available schedule slots...');
    
    const { searchParams } = new URL(request.url);
    const availableOnly = searchParams.get('available') === 'true';
    const date = searchParams.get('date');
    
    // Build where clause
    const whereClause: any = {};
    
    if (availableOnly) {
      whereClause.isAvailable = true;
      // Only show slots that haven't reached capacity
      whereClause.OR = [
        { capacity: null }, // No capacity limit
        { 
          AND: [
            { capacity: { not: null } },
            { bookedCount: { lt: prisma.scheduleSlot.fields.capacity } }
          ]
        }
      ];
    }
    
    if (date) {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setDate(endOfDay.getDate() + 1);
      
      whereClause.startTime = {
        gte: startOfDay,
        lt: endOfDay
      };
    }

    // Fetch schedule slots
    const slots = await prisma.scheduleSlot.findMany({
      where: whereClause,
      include: {
        scheduleTemplate: {
          include: {
            sessionDuration: {
              select: {
                name: true,
                duration_minutes: true
              }
            }
          }
        }
      },
      orderBy: [
        { startTime: 'asc' }
      ]
    });

    // Transform the data to match the expected format
    const transformedSlots = slots.map(slot => ({
      id: slot.id,
      date: slot.startTime.toISOString().split('T')[0], // Format as YYYY-MM-DD
      time: slot.startTime.toTimeString().split(' ')[0].substring(0, 5), // Format as HH:MM
      isAvailable: slot.isAvailable && (slot.capacity === null || (slot.bookedCount || 0) < slot.capacity),
      capacity: slot.capacity,
      bookedCount: slot.bookedCount || 0,
      duration: slot.scheduleTemplate.sessionDuration?.duration_minutes || 60,
      sessionType: slot.scheduleTemplate.sessionDuration?.name || 'Standard Session'
    }));

    console.log(`✅ Found ${transformedSlots.length} schedule slots`);

    return NextResponse.json({
      success: true,
      slots: transformedSlots
    });

  } catch (error) {
    console.error('❌ Error in GET /api/schedule-slots:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch schedule slots',
      message: 'An error occurred while fetching schedule slots'
    }, { status: 500 });
  }
}
