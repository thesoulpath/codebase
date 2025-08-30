import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // Sample customer data with complete astrology consultation information
    const sampleCustomers = [
      {
        name: 'Maria Garcia',
        email: 'maria.garcia@example.com',
        phone: '+1 (555) 123-4567',
        status: 'active',
        birth_date: '1985-03-15',
        birth_time: '14:30',
        birth_place: 'Madrid, Spain',
        question: 'I want to understand my relationship patterns and find true love. I\'ve been through several relationships but none seem to last. What does my chart reveal about my romantic destiny?',
        language: 'es',
        admin_notes: 'Spanish-speaking client, interested in relationship astrology. Very engaged and asks thoughtful questions. Prefers evening sessions.',
        created_at: new Date().toISOString()
      },
      {
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '+1 (555) 234-5678',
        status: 'confirmed',
        birth_date: '1990-07-22',
        birth_time: '09:15',
        birth_place: 'New York, USA',
        question: 'I\'m at a crossroads in my career. Should I stay in my current job or take the leap to start my own business? I need guidance on timing and what my chart suggests about my professional path.',
        language: 'en',
        admin_notes: 'Career-focused client, analytical mindset. Interested in business astrology and timing. Good candidate for follow-up sessions.',
        created_at: new Date().toISOString()
      },
      {
        name: 'Ana Rodriguez',
        email: 'ana.rodriguez@example.com',
        phone: '+1 (555) 345-6789',
        status: 'pending',
        birth_date: '1988-11-08',
        birth_time: '16:45',
        birth_place: 'Barcelona, Spain',
        question: 'I feel lost and don\'t know my life purpose. What does my birth chart reveal about my spiritual journey and the work I\'m meant to do in this lifetime?',
        language: 'es',
        admin_notes: 'Spiritual seeker, very open to guidance. First-time astrology client. May need extra support and explanation of concepts.',
        created_at: new Date().toISOString()
      }
    ];

    // Insert all sample customers
    const { data, error } = await supabase
      .from('clients')
      .insert(sampleCustomers)
      .select();

    if (error) {
      console.error('Error seeding customers:', error);
      return NextResponse.json({
        error: 'Failed to seed customers',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Sample customers created successfully',
      count: data?.length || 0,
      customers: data
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
