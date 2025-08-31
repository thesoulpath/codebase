import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed...');

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
      fromName: 'SOULPATH',
      brevoApiKey: '',
      senderEmail: 'noreply@soulpath.lat',
      senderName: 'SOULPATH',
      adminEmail: 'admin@soulpath.lat'
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
    }),
    prisma.emailTemplate.upsert({
      where: { templateKey: 'welcome_en' },
      update: {},
      create: {
        templateKey: 'welcome_en',
        subject: 'Welcome to SOULPATH',
        body: 'Welcome to SOULPATH! We are excited to be part of your wellness journey.',
        language: 'en'
      }
    }),
    prisma.emailTemplate.upsert({
      where: { templateKey: 'welcome_es' },
      update: {},
      create: {
        templateKey: 'welcome_es',
        subject: 'Bienvenido a SOULPATH',
        body: '¡Bienvenido a SOULPATH! Estamos emocionados de ser parte de tu camino al bienestar.',
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

  // 6. Create currencies
  console.log('💰 Creating currencies...');
  const currencies = await Promise.all([
    prisma.currency.upsert({
      where: { code: 'USD' },
      update: {},
      create: {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        is_default: true,
        exchange_rate: 1.000000
      }
    }),
    prisma.currency.upsert({
      where: { code: 'EUR' },
      update: {},
      create: {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        is_default: false,
        exchange_rate: 0.850000
      }
    }),
    prisma.currency.upsert({
      where: { code: 'MXN' },
      update: {},
      create: {
        code: 'MXN',
        name: 'Mexican Peso',
        symbol: 'MXN$',
        is_default: false,
        exchange_rate: 18.500000
      }
    }),
    prisma.currency.upsert({
      where: { code: 'CAD' },
      update: {},
      create: {
        code: 'CAD',
        name: 'Canadian Dollar',
        symbol: 'C$',
        is_default: false,
        exchange_rate: 1.350000
      }
    })
  ]);
  console.log('✅ Currencies created:', currencies.length);

  // 7. Create session durations
  console.log('⏱️ Creating session durations...');
  const sessionDurations = await Promise.all([
    prisma.sessionDuration.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: '30 Minutes',
        duration_minutes: 30,
        description: 'Quick wellness session',
        isActive: true
      }
    }),
    prisma.sessionDuration.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: '60 Minutes',
        duration_minutes: 60,
        description: 'Standard wellness session',
        isActive: true
      }
    }),
    prisma.sessionDuration.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: '90 Minutes',
        duration_minutes: 90,
        description: 'Extended wellness session',
        isActive: true
      }
    }),
    prisma.sessionDuration.upsert({
      where: { id: 4 },
      update: {},
      create: {
        name: '120 Minutes',
        duration_minutes: 120,
        description: 'Comprehensive wellness session',
        isActive: true
      }
    })
  ]);
  console.log('✅ Session durations created:', sessionDurations.length);

  // 8. Create rates
  console.log('💵 Creating rates...');
  const rates = await Promise.all([
    // Individual session rates
    prisma.rate.upsert({
      where: { id: 1 },
      update: {},
      create: {
        currencyId: 1, // USD
        sessionDurationId: 1, // 30 minutes
        sessionType: 'individual',
        base_price: 50.00,
        group_discount_percent: 0,
        min_group_size: 1,
        max_group_size: 1,
        isActive: true
      }
    }),
    prisma.rate.upsert({
      where: { id: 2 },
      update: {},
      create: {
        currencyId: 1, // USD
        sessionDurationId: 2, // 60 minutes
        sessionType: 'individual',
        base_price: 80.00,
        group_discount_percent: 0,
        min_group_size: 1,
        max_group_size: 1,
        isActive: true
      }
    }),
    prisma.rate.upsert({
      where: { id: 3 },
      update: {},
      create: {
        currencyId: 1, // USD
        sessionDurationId: 3, // 90 minutes
        sessionType: 'individual',
        base_price: 120.00,
        group_discount_percent: 0,
        min_group_size: 1,
        max_group_size: 1,
        isActive: true
      }
    }),
    // Group session rates
    prisma.rate.upsert({
      where: { id: 4 },
      update: {},
      create: {
        currencyId: 1, // USD
        sessionDurationId: 2, // 60 minutes
        sessionType: 'group',
        base_price: 60.00,
        group_discount_percent: 25.00,
        min_group_size: 2,
        max_group_size: 5,
        isActive: true
      }
    })
  ]);
  console.log('✅ Rates created:', rates.length);

  // 9. Create package definitions
  console.log('📦 Creating package definitions...');
  const packageDefinitions = await Promise.all([
    prisma.packageDefinition.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Starter Package',
        description: 'Perfect for beginners',
        sessionsCount: 3,
        sessionDurationId: 2, // 60 minutes
        packageType: 'individual',
        maxGroupSize: 1,
        isActive: true
      }
    }),
    prisma.packageDefinition.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Wellness Package',
        description: 'Comprehensive wellness program',
        sessionsCount: 6,
        sessionDurationId: 2, // 60 minutes
        packageType: 'individual',
        maxGroupSize: 1,
        isActive: true
      }
    }),
    prisma.packageDefinition.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: 'Group Wellness',
        description: 'Group wellness sessions',
        sessionsCount: 4,
        sessionDurationId: 2, // 60 minutes
        packageType: 'group',
        maxGroupSize: 5,
        isActive: true
      }
    })
  ]);
  console.log('✅ Package definitions created:', packageDefinitions.length);

  // 10. Create package prices
  console.log('💲 Creating package prices...');
  const packagePrices = await Promise.all([
    prisma.packagePrice.upsert({
      where: { id: 1 },
      update: {},
      create: {
        packageDefinitionId: 1, // Starter Package
        currencyId: 1, // USD
        price: 200.00,
        pricingMode: 'fixed',
        isActive: true
      }
    }),
    prisma.packagePrice.upsert({
      where: { id: 2 },
      update: {},
      create: {
        packageDefinitionId: 2, // Wellness Package
        currencyId: 1, // USD
        price: 400.00,
        pricingMode: 'fixed',
        isActive: true
      }
    }),
    prisma.packagePrice.upsert({
      where: { id: 3 },
      update: {},
      create: {
        packageDefinitionId: 3, // Group Wellness
        currencyId: 1, // USD
        price: 180.00,
        pricingMode: 'fixed',
        isActive: true
      }
    })
  ]);
  console.log('✅ Package prices created:', packagePrices.length);

  // 11. Create schedule templates
  console.log('📅 Creating schedule templates...');
  const scheduleTemplates = await Promise.all([
    prisma.scheduleTemplate.upsert({
      where: { id: 1 },
      update: {},
      create: {
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '17:00',
        capacity: 3,
        isAvailable: true,
        sessionDurationId: 2, // 60 minutes
        autoAvailable: true
      }
    }),
    prisma.scheduleTemplate.upsert({
      where: { id: 2 },
      update: {},
      create: {
        dayOfWeek: 'Tuesday',
        startTime: '09:00',
        endTime: '17:00',
        capacity: 3,
        isAvailable: true,
        sessionDurationId: 2, // 60 minutes
        autoAvailable: true
      }
    }),
    prisma.scheduleTemplate.upsert({
      where: { id: 3 },
      update: {},
      create: {
        dayOfWeek: 'Wednesday',
        startTime: '09:00',
        endTime: '17:00',
        capacity: 3,
        isAvailable: true,
        sessionDurationId: 2, // 60 minutes
        autoAvailable: true
      }
    }),
    prisma.scheduleTemplate.upsert({
      where: { id: 4 },
      update: {},
      create: {
        dayOfWeek: 'Thursday',
        startTime: '09:00',
        endTime: '17:00',
        capacity: 3,
        isAvailable: true,
        sessionDurationId: 2, // 60 minutes
        autoAvailable: true
      }
    }),
    prisma.scheduleTemplate.upsert({
      where: { id: 5 },
      update: {},
      create: {
        dayOfWeek: 'Friday',
        startTime: '09:00',
        endTime: '17:00',
        capacity: 3,
        isAvailable: true,
        sessionDurationId: 2, // 60 minutes
        autoAvailable: true
      }
    }),
    prisma.scheduleTemplate.upsert({
      where: { id: 6 },
      update: {},
      create: {
        dayOfWeek: 'Saturday',
        startTime: '10:00',
        endTime: '16:00',
        capacity: 3,
        isAvailable: true,
        sessionDurationId: 2, // 60 minutes
        autoAvailable: true
      }
    })
  ]);
  console.log('✅ Schedule templates created:', scheduleTemplates.length);

  // 12. Create legacy schedules (for backward compatibility)
  console.log('📅 Creating legacy schedules...');
  const schedules = await Promise.all([
    prisma.schedule.upsert({
      where: { id: 1 },
      update: {},
      create: {
        day_of_week: 'Monday',
        start_time: '09:00',
        end_time: '17:00',
        capacity: 3,
        is_available: true,
        auto_available: true,
        session_duration_id: 2
      }
    }),
    prisma.schedule.upsert({
      where: { id: 2 },
      update: {},
      create: {
        day_of_week: 'Tuesday',
        start_time: '09:00',
        end_time: '17:00',
        capacity: 3,
        is_available: true,
        auto_available: true,
        session_duration_id: 2
      }
    })
  ]);
  console.log('✅ Legacy schedules created:', schedules.length);

  // 13. Create payment method configurations
  console.log('💳 Creating payment method configurations...');
  const paymentMethods = await Promise.all([
    prisma.paymentMethodConfig.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Stripe',
        type: 'stripe',
        isActive: true,
        description: 'Credit card payments via Stripe',
        icon: 'credit-card',
        requiresConfirmation: false,
        autoAssignPackage: true
      }
    }),
    prisma.paymentMethodConfig.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Cash',
        type: 'cash',
        isActive: true,
        description: 'Cash payments',
        icon: 'dollar-sign',
        requiresConfirmation: true,
        autoAssignPackage: false
      }
    }),
    prisma.paymentMethodConfig.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: 'Bank Transfer',
        type: 'bank_transfer',
        isActive: true,
        description: 'Bank transfer payments',
        icon: 'building',
        requiresConfirmation: true,
        autoAssignPackage: false
      }
    })
  ]);
  console.log('✅ Payment methods created:', paymentMethods.length);

  // 14. Create group booking tiers
  console.log('👥 Creating group booking tiers...');
  const groupBookingTiers = await Promise.all([
    prisma.group_booking_tiers.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Small Group (2-3 people)',
        min_participants: 2,
        max_participants: 3,
        discount_percent: 15.00,
        description: 'Small group discount',
        is_active: true
      }
    }),
    prisma.group_booking_tiers.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Medium Group (4-6 people)',
        min_participants: 4,
        max_participants: 6,
        discount_percent: 25.00,
        description: 'Medium group discount',
        is_active: true
      }
    }),
    prisma.group_booking_tiers.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: 'Large Group (7+ people)',
        min_participants: 7,
        max_participants: 10,
        discount_percent: 35.00,
        description: 'Large group discount',
        is_active: true
      }
    })
  ]);
  console.log('✅ Group booking tiers created:', groupBookingTiers.length);

  // 15. Create legacy soul packages (for backward compatibility)
  console.log('📦 Creating legacy soul packages...');
  const soulPackages = await Promise.all([
    prisma.soulPackage.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Starter Package',
        sessionsCount: 3,
        sessionDurationId: 2, // 60 minutes
        currencyId: 1, // USD
        packagePrice: 200.00,
        discountPercent: 0.00,
        description: 'Perfect for beginners',
        isActive: true,
        packageType: 'individual',
        maxGroupSize: 1
      }
    }),
    prisma.soulPackage.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Wellness Package',
        sessionsCount: 6,
        sessionDurationId: 2, // 60 minutes
        currencyId: 1, // USD
        packagePrice: 400.00,
        discountPercent: 10.00,
        description: 'Comprehensive wellness program',
        isActive: true,
        packageType: 'individual',
        maxGroupSize: 1
      }
    })
  ]);
  console.log('✅ Legacy soul packages created:', soulPackages.length);

  // 16. Create test clients
  console.log('👥 Creating test clients...');
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { email: 'john.doe@example.com' },
      update: {},
      create: {
        email: 'john.doe@example.com',
        name: 'John Doe',
        phone: '+1234567890',
        status: 'active',
        notes: 'Test client for development',
        birthDate: new Date('1990-01-15'),
        birthTime: new Date('1990-01-15T10:30:00'),
        birthPlace: 'New York, USA',
        question: 'How can I improve my overall wellness?',
        language: 'en',
        adminNotes: 'Interested in individual sessions'
      }
    }),
    prisma.client.upsert({
      where: { email: 'maria.garcia@example.com' },
      update: {},
      create: {
        email: 'maria.garcia@example.com',
        name: 'Maria Garcia',
        phone: '+1234567891',
        status: 'active',
        notes: 'Spanish-speaking client',
        birthDate: new Date('1985-06-20'),
        birthTime: new Date('1985-06-20T14:15:00'),
        birthPlace: 'Madrid, Spain',
        question: '¿Cómo puedo manejar mejor el estrés?',
        language: 'es',
        adminNotes: 'Prefiere sesiones en español'
      }
    }),
    prisma.client.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: 'Test Client',
        phone: '+1234567892',
        status: 'active',
        notes: 'Test client for development',
        birthDate: new Date('1995-03-10'),
        birthTime: new Date('1995-03-10T09:00:00'),
        birthPlace: 'Toronto, Canada',
        question: 'What wellness services do you offer?',
        language: 'en',
        adminNotes: 'New client, needs consultation'
      }
    })
  ]);
  console.log('✅ Test clients created:', clients.length);

  // 17. Create test user packages
  console.log('📦 Creating test user packages...');
  const userPackages = await Promise.all([
    prisma.userPackage.upsert({
      where: { id: 1 },
      update: {},
      create: {
        user_email: 'john.doe@example.com',
        packageId: 1, // Starter Package
        sessionsRemaining: 3,
        sessionsUsed: 0,
        purchasedAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        isActive: true,
        groupSessionsRemaining: 0,
        groupSessionsUsed: 0,
        purchasePrice: 200.00,
        originalPrice: 200.00,
        discountApplied: 0.00,
        paymentMethod: 'stripe',
        paymentStatus: 'confirmed',
        paymentConfirmedAt: new Date(),
        clientId: 1
      }
    }),
    prisma.userPackage.upsert({
      where: { id: 2 },
      update: {},
      create: {
        user_email: 'maria.garcia@example.com',
        packageId: 2, // Wellness Package
        sessionsRemaining: 6,
        sessionsUsed: 1,
        purchasedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        isActive: true,
        groupSessionsRemaining: 0,
        groupSessionsUsed: 0,
        purchasePrice: 360.00,
        originalPrice: 400.00,
        discountApplied: 40.00,
        paymentMethod: 'cash',
        paymentStatus: 'confirmed',
        paymentConfirmedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        clientId: 2
      }
    })
  ]);
  console.log('✅ Test user packages created:', userPackages.length);

  // 18. Create test bookings
  console.log('📋 Creating test bookings...');
  const bookings = await Promise.all([
    prisma.booking.upsert({
      where: { id: 1 },
      update: {},
      create: {
        clientEmail: 'john.doe@example.com',
        booking_date: new Date('2024-12-25'),
        sessionTime: new Date('2024-12-25T10:00:00'),
        sessionType: 'Wellness Session',
        status: 'confirmed',
        notes: 'Test booking for development',
        schedule_id: 1,
        start_time: '10:00',
        end_time: '11:00',
        package_id: 1,
        is_group_booking: false,
        group_size: 1,
        total_amount: 80.00,
        currency_id: 1,
        discount_amount: 0.00,
        final_amount: 80.00,
        clientId: 1,
        userPackageId: 1,
        bookingType: 'individual'
      }
    }),
    prisma.booking.upsert({
      where: { id: 2 },
      update: {},
      create: {
        clientEmail: 'maria.garcia@example.com',
        booking_date: new Date('2024-12-26'),
        sessionTime: new Date('2024-12-26T14:00:00'),
        sessionType: 'Wellness Session',
        status: 'confirmed',
        notes: 'Sesión en español',
        schedule_id: 2,
        start_time: '14:00',
        end_time: '15:00',
        package_id: 2,
        is_group_booking: false,
        group_size: 1,
        total_amount: 80.00,
        currency_id: 1,
        discount_amount: 0.00,
        final_amount: 80.00,
        clientId: 2,
        userPackageId: 2,
        bookingType: 'individual'
      }
    })
  ]);
  console.log('✅ Test bookings created:', bookings.length);

  // 19. Create test payment records
  console.log('💳 Creating test payment records...');
  const paymentRecords = await Promise.all([
    prisma.paymentRecord.upsert({
      where: { id: 1 },
      update: {},
      create: {
        clientEmail: 'john.doe@example.com',
        userPackageId: 1,
        amount: 200.00,
        currencyCode: 'USD',
        paymentMethod: 'stripe',
        paymentStatus: 'confirmed',
        transactionId: 'txn_123456789',
        notes: 'Starter package payment',
        paymentDate: new Date(),
        confirmedAt: new Date(),
        clientId: 1
      }
    }),
    prisma.paymentRecord.upsert({
      where: { id: 2 },
      update: {},
      create: {
        clientEmail: 'maria.garcia@example.com',
        userPackageId: 2,
        amount: 360.00,
        currencyCode: 'USD',
        paymentMethod: 'cash',
        paymentStatus: 'confirmed',
        transactionId: null,
        notes: 'Wellness package payment - cash',
        paymentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        confirmedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        clientId: 2
      }
    })
  ]);
  console.log('✅ Test payment records created:', paymentRecords.length);

  // 20. Create profile
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

  // 21. Create profile image
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

  // 22. Create test images
  console.log('🖼️ Creating test images...');
  const images = await Promise.all([
    prisma.image.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Wellness Center',
        url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
        altText: 'Peaceful wellness center environment',
        category: 'facility'
      }
    }),
    prisma.image.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Meditation Room',
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        altText: 'Tranquil meditation room',
        category: 'facility'
      }
    }),
    prisma.image.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: 'Wellness Session',
        url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop',
        altText: 'Professional wellness session',
        category: 'service'
      }
    })
  ]);
  console.log('✅ Test images created:', images.length);

  // 23. Create test bug reports
  console.log('🐛 Creating test bug reports...');
  const bugReports = await Promise.all([
    prisma.bugReport.upsert({
      where: { id: 'bug-001' },
      update: {},
      create: {
        id: 'bug-001',
        title: 'Payment form not working',
        description: 'The Stripe payment form is not loading properly on mobile devices.',
        screenshot: null,
        status: 'OPEN',
        priority: 'HIGH',
        category: 'Payment System',
        reporterId: 'admin-profile',
        assignedTo: null
      }
    }),
    prisma.bugReport.upsert({
      where: { id: 'bug-002' },
      update: {},
      create: {
        id: 'bug-002',
        title: 'Email notifications not sending',
        description: 'Booking confirmation emails are not being sent to clients.',
        screenshot: null,
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        category: 'Email System',
        reporterId: 'admin-profile',
        assignedTo: 'admin-profile'
      }
    })
  ]);
  console.log('✅ Test bug reports created:', bugReports.length);

  // 24. Create test bug comments
  console.log('💬 Creating test bug comments...');
  const bugComments = await Promise.all([
    prisma.bugComment.upsert({
      where: { id: 'comment-001' },
      update: {},
      create: {
        id: 'comment-001',
        content: 'This issue has been reported by multiple users. Need to investigate the mobile payment flow.',
        authorId: 'admin-profile',
        bugReportId: 'bug-001'
      }
    }),
    prisma.bugComment.upsert({
      where: { id: 'comment-002' },
      update: {},
      create: {
        id: 'comment-002',
        content: 'Working on fixing the email configuration. Should be resolved by tomorrow.',
        authorId: 'admin-profile',
        bugReportId: 'bug-002'
      }
    })
  ]);
  console.log('✅ Test bug comments created:', bugComments.length);

  console.log('');
  console.log('🎉 Comprehensive database seeding completed successfully!');
  console.log('');
  console.log('📊 Created:');
  console.log(`   📧 Email config: ${emailConfig.id}`);
  console.log(`   📝 Email templates: ${emailTemplates.length}`);
  console.log(`   📄 Content: ${content.id}`);
  console.log(`   🎨 Logo settings: ${logoSettings.id}`);
  console.log(`   🔍 SEO settings: ${seo.id}`);
  console.log(`   💰 Currencies: ${currencies.length}`);
  console.log(`   ⏱️ Session durations: ${sessionDurations.length}`);
  console.log(`   💵 Rates: ${rates.length}`);
  console.log(`   📦 Package definitions: ${packageDefinitions.length}`);
  console.log(`   💲 Package prices: ${packagePrices.length}`);
  console.log(`   📅 Schedule templates: ${scheduleTemplates.length}`);
  console.log(`   📅 Legacy schedules: ${schedules.length}`);
  console.log(`   💳 Payment methods: ${paymentMethods.length}`);
  console.log(`   👥 Group booking tiers: ${groupBookingTiers.length}`);
  console.log(`   📦 Legacy soul packages: ${soulPackages.length}`);
  console.log(`   👥 Test clients: ${clients.length}`);
  console.log(`   📦 Test user packages: ${userPackages.length}`);
  console.log(`   📋 Test bookings: ${bookings.length}`);
  console.log(`   💳 Test payment records: ${paymentRecords.length}`);
  console.log(`   👤 Admin profile: ${profile.id}`);
  console.log(`   🖼️ Profile image: ${profileImage.id}`);
  console.log(`   🖼️ Test images: ${images.length}`);
  console.log(`   🐛 Test bug reports: ${bugReports.length}`);
  console.log(`   💬 Test bug comments: ${bugComments.length}`);
  console.log('');
  console.log('🚀 Your SOULPATH system is now fully seeded and ready for testing!');
  console.log('');
  console.log('🔑 Test Credentials:');
  console.log('   Admin: admin@soulpath.lat');
  console.log('   Client 1: john.doe@example.com');
  console.log('   Client 2: maria.garcia@example.com');
  console.log('   Client 3: test@example.com');
  console.log('');
  console.log('💡 You can now test all features including:');
  console.log('   • Booking system');
  console.log('   • Payment processing');
  console.log('   • Package management');
  console.log('   • Schedule management');
  console.log('   • Bug reporting system');
  console.log('   • Email notifications');
  console.log('   • Multi-language support');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
