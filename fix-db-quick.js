const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixDatabase() {
  console.log('🔧 Quick database fix starting...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Add missing columns
    console.log('📝 Adding missing columns...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE clients 
        ADD COLUMN IF NOT EXISTS birth_date DATE,
        ADD COLUMN IF NOT EXISTS birth_time TIME,
        ADD COLUMN IF NOT EXISTS birth_place TEXT,
        ADD COLUMN IF NOT EXISTS question TEXT,
        ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
        ADD COLUMN IF NOT EXISTS admin_notes TEXT,
        ADD COLUMN IF NOT EXISTS scheduled_date DATE,
        ADD COLUMN IF NOT EXISTS scheduled_time TIME,
        ADD COLUMN IF NOT EXISTS session_type TEXT,
        ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS last_booking TIMESTAMP WITH TIME ZONE;
      `
    });

    if (alterError) {
      console.log('⚠️  Columns might already exist, continuing...');
    }

    // Update test client
    console.log('🔄 Updating test client...');
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        birth_date: '1990-01-01',
        birth_place: 'Test City, Test Country',
        question: 'Test question for development purposes',
        language: 'en'
      })
      .eq('email', 'test@example.com');

    if (updateError) {
      console.log('⚠️  Test client update failed:', updateError.message);
    }

    // Insert sample customers
    console.log('👥 Creating sample customers...');
    const sampleCustomers = [
      {
        name: 'Maria Garcia',
        email: 'maria.garcia@example.com',
        phone: '+1 (555) 123-4567',
        status: 'active',
        birth_date: '1985-03-15',
        birth_place: 'Madrid, Spain',
        question: 'I want to understand my relationship patterns and find true love. What does my chart reveal about my romantic destiny?',
        language: 'es'
      },
      {
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '+1 (555) 234-5678',
        status: 'confirmed',
        birth_date: '1990-07-22',
        birth_place: 'New York, USA',
        question: 'I\'m at a crossroads in my career. Should I stay in my current job or take the leap to start my own business?',
        language: 'en'
      },
      {
        name: 'Ana Rodriguez',
        email: 'ana.rodriguez@example.com',
        phone: '+1 (555) 345-6789',
        status: 'pending',
        birth_date: '1988-11-08',
        birth_place: 'Barcelona, Spain',
        question: 'I feel lost and don\'t know my life purpose. What does my birth chart reveal about my spiritual journey?',
        language: 'es'
      }
    ];

    const { data, error: insertError } = await supabase
      .from('clients')
      .upsert(sampleCustomers, { onConflict: 'email' })
      .select();

    if (insertError) {
      console.error('❌ Error creating sample customers:', insertError.message);
    } else {
      console.log(`✅ Successfully created/updated ${data?.length || 0} customers`);
    }

    // Verify the fix
    console.log('🔍 Verifying database structure...');
    const { data: clients, error: selectError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);

    if (selectError) {
      console.error('❌ Error selecting clients:', selectError.message);
    } else if (clients && clients.length > 0) {
      const client = clients[0];
      console.log('✅ Database structure verified!');
      console.log('📋 Available fields:', Object.keys(client));
    }

    console.log('🎉 Database fix completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

fixDatabase();
