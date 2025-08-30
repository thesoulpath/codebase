import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create email configuration
  console.log('📧 Creating email configuration...');
  const emailConfig = await prisma.emailConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: '',
      smtpPass: '',
      fromEmail: 'noreply@soulpath.lat',
      fromName: 'SOULPATH'
    }
  });
  console.log('✅ Email config created:', emailConfig.id);

  // 2. Create email templates
  console.log('📝 Creating email templates...');
  const emailTemplates = await Promise.all([
    prisma.emailTemplate.upsert({
      where: { templateKey: 'booking_confirmation_en' },
      update: {},
      create: {
        templateKey: 'booking_confirmation_en',
        subject: 'Booking Confirmation - SOULPATH',
        body: 'Your session has been confirmed. We look forward to seeing you!',
        language: 'en'
      }
    }),
    prisma.emailTemplate.upsert({
      where: { templateKey: 'booking_confirmation_es' },
      update: {},
      create: {
        templateKey: 'booking_confirmation_es',
        subject: 'Confirmación de Reserva - SOULPATH',
        body: 'Tu sesión ha sido confirmada. ¡Esperamos verte!',
        language: 'es'
      }
    }),
    prisma.emailTemplate.upsert({
      where: { templateKey: 'reminder_en' },
      update: {},
      create: {
        templateKey: 'reminder_en',
        subject: 'Session Reminder - SOULPATH',
        body: 'This is a reminder for your upcoming session. Please arrive 10 minutes early.',
        language: 'en'
      }
    }),
    prisma.emailTemplate.upsert({
      where: { templateKey: 'reminder_es' },
      update: {},
      create: {
        templateKey: 'reminder_es',
        subject: 'Recordatorio de Sesión - SOULPATH',
        body: 'Este es un recordatorio para tu próxima sesión. Por favor llega 10 minutos antes.',
        language: 'es'
      }
    })
  ]);
  console.log('✅ Email templates created:', emailTemplates.length);

  // 3. Create content
  console.log('📄 Creating website content...');
  const content = await prisma.content.upsert({
    where: { id: 1 },
    update: {},
    create: {
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
  console.log('✅ Content created:', content.id);

  // 4. Create logo settings
  console.log('🎨 Creating logo settings...');
  const logoSettings = await prisma.logoSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      type: 'text',
      text: 'SOULPATH',
      imageUrl: null
    }
  });
  console.log('✅ Logo settings created:', logoSettings.id);

  // 5. Create SEO settings
  console.log('🔍 Creating SEO settings...');
  const seo = await prisma.seo.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'SOULPATH - Wellness & Healing',
      description: 'Your journey to wellness starts here. Professional wellness services in a peaceful environment.',
      keywords: 'wellness, healing, therapy, meditation, soulpath',
      ogImage: null
    }
  });
  console.log('✅ SEO settings created:', seo.id);

  // 6. Create schedule
  console.log('📅 Creating schedule...');
  const schedule = await prisma.schedule.upsert({
    where: { id: 1 },
    update: {},
    create: {
      dayOfWeek: 'Monday',
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true
    }
  });
  console.log('✅ Schedule created:', schedule.id);

  // 7. Create test client
  console.log('👥 Creating test client...');
  const client = await prisma.client.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test Client',
      phone: '+1234567890',
      status: 'active',
      notes: 'Test client for development'
    }
  });
  console.log('✅ Test client created:', client.id);

  // 8. Create test booking
  console.log('📋 Creating test booking...');
  const booking = await prisma.booking.upsert({
    where: { id: 1 },
    update: {},
    create: {
      clientEmail: 'test@example.com',
      sessionDate: new Date('2024-12-25'),
      sessionTime: '10:00',
      sessionType: 'Wellness Session',
      status: 'confirmed',
      notes: 'Test booking for development'
    }
  });
  console.log('✅ Test booking created:', booking.id);

  // 9. Create profile
  console.log('👤 Creating admin profile...');
  const profile = await prisma.profile.upsert({
    where: { id: 'admin-profile' },
    update: {},
    create: {
      id: 'admin-profile',
      email: 'admin@soulpath.lat',
      fullName: 'Admin User',
      avatarUrl: null,
      role: 'admin'
    }
  });
  console.log('✅ Admin profile created:', profile.id);

  // 10. Create profile image
  console.log('🖼️ Creating profile image...');
  const profileImage = await prisma.profileImage.upsert({
    where: { key: 'hero_profile' },
    update: {},
    create: {
      key: 'hero_profile',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      altText: 'Jose Profile - SOULPATH Wellness'
    }
  });
  console.log('✅ Profile image created:', profileImage.id);

  console.log('');
  console.log('🎉 Database seeding completed successfully!');
  console.log('');
  console.log('📊 Created:');
  console.log(`   📧 Email config: ${emailConfig.id}`);
  console.log(`   📝 Email templates: ${emailTemplates.length}`);
  console.log(`   📄 Content: ${content.id}`);
  console.log(`   🎨 Logo settings: ${logoSettings.id}`);
  console.log(`   🔍 SEO settings: ${seo.id}`);
  console.log(`   📅 Schedule: ${schedule.id}`);
  console.log(`   👥 Test client: ${client.id}`);
  console.log(`   📋 Test booking: ${booking.id}`);
  console.log(`   👤 Admin profile: ${profile.id}`);
  console.log(`   🖼️ Profile image: ${profileImage.id}`);
  console.log('');
  console.log('🚀 Your admin dashboard should now work perfectly!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
