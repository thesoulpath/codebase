const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;

console.log('🔍 Testing direct database connection...');
console.log('Database URL:', databaseUrl ? '✅ Present' : '❌ Missing');

if (!databaseUrl) {
  console.log('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('📡 Attempting to connect to database...');
    await client.connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('🕒 Database time:', result.rows[0].current_time);
    
    // Test if our tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('email_config', 'content', 'logo_settings', 'seo')
      ORDER BY table_name
    `);
    
    console.log('📊 Found tables:', tablesResult.rows.map(row => row.table_name));
    
    await client.end();
    
    console.log('');
    console.log('🎉 Direct database connection working!');
    console.log('✅ Prisma should now work with: npx prisma db pull');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('');
    console.log('🔍 Common issues:');
    console.log('- Check if the password is correct');
    console.log('- Verify IP restrictions in Supabase dashboard');
    console.log('- Ensure the database is accessible from external connections');
    
    await client.end().catch(() => {});
  }
}

testConnection();
