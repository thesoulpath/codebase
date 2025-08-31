const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

async function quickPrismaFix() {
  console.log('🚀 Starting quick Prisma fix...');
  
  // Check environment variables
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    return;
  }

  console.log('🔗 Database URL found:', databaseUrl.substring(0, 50) + '...');

  try {
    // Create Prisma client with connection timeout
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      // Add connection timeout
      __internal: {
        engine: {
          connectTimeout: 10000, // 10 seconds
        },
      },
    });

    console.log('📡 Testing database connection...');
    
    // Test connection with a simple query
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Try to get table info
    console.log('🔍 Checking current database structure...');
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'clients' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    console.log('📊 Current clients table structure:');
    console.table(result);

    // Close connection
    await prisma.$disconnect();
    console.log('🔌 Connection closed');

    console.log('🎯 Now you can run: npx prisma db push --force-reset');
    console.log('💡 Or run the SQL migration in Supabase dashboard for instant results');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('timeout')) {
      console.log('⏰ Connection timeout - database might be slow or unreachable');
    } else if (error.message.includes('authentication')) {
      console.log('🔐 Authentication failed - check your DATABASE_URL');
    } else if (error.message.includes('connection')) {
      console.log('🌐 Connection failed - check network and database status');
    }
    
    console.log('\n🔧 Quick fixes to try:');
    console.log('1. Run the SQL migration in Supabase dashboard (fastest)');
    console.log('2. Check your DATABASE_URL in .env.local');
    console.log('3. Verify Supabase database is running');
  }
}

quickPrismaFix();
