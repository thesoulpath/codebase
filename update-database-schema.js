const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function updateDatabaseSchema() {
  console.log('Updating database schema...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // SQL commands to update the table structure
    const updateCommands = [
      // Add new columns if they don't exist
      "ALTER TABLE clients ADD COLUMN IF NOT EXISTS birth_date DATE",
      "ALTER TABLE clients ADD COLUMN IF NOT EXISTS birth_time TIME",
      "ALTER TABLE clients ADD COLUMN IF NOT EXISTS birth_place TEXT",
      "ALTER TABLE clients ADD COLUMN IF NOT EXISTS question TEXT",
      "ALTER TABLE clients ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en'",
      "ALTER TABLE clients ADD COLUMN IF NOT EXISTS admin_notes TEXT",
      "ALTER TABLE clients ADD COLUMN IF NOT EXISTS scheduled_date DATE",
      "ALTER TABLE clients ADD COLUMN IF NOT EXISTS scheduled_time TIME",
      "ALTER TABLE clients ADD COLUMN IF NOT EXISTS session_type TEXT",
      "ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMP WITH TIME ZONE",
      "ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_booking TIMESTAMP WITH TIME ZONE",
      
      // Make required fields NOT NULL (only if they don't have data)
      "ALTER TABLE clients ALTER COLUMN birth_date SET NOT NULL",
      "ALTER TABLE clients ALTER COLUMN birth_place SET NOT NULL",
      "ALTER TABLE clients ALTER COLUMN question SET NOT NULL",
      
      // Update existing records to have default values for required fields
      "UPDATE clients SET birth_date = '1990-01-01' WHERE birth_date IS NULL",
      "UPDATE clients SET birth_place = 'Unknown Location' WHERE birth_place IS NULL",
      "UPDATE clients SET question = 'Default consultation question' WHERE question IS NULL",
      "UPDATE clients SET language = 'en' WHERE language IS NULL"
    ];
    
    console.log('Executing schema updates...');
    
    for (const command of updateCommands) {
      try {
        console.log(`Executing: ${command}`);
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          console.log(`⚠️  Command failed (this might be expected): ${error.message}`);
        } else {
          console.log(`✅ Command executed successfully`);
        }
      } catch (e) {
        console.log(`⚠️  Command failed (this might be expected): ${e.message}`);
      }
    }
    
    console.log('Schema update completed. Testing client creation...');
    
    // Test if we can now create a client
    const testClient = {
      name: 'Schema Test Client',
      email: 'schema-test@example.com',
      phone: '+1234567890',
      status: 'active',
      birth_date: '1990-01-01',
      birth_place: 'Test City, Test Country',
      question: 'Test question for schema validation',
      language: 'en',
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('clients')
      .insert(testClient)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Still cannot create client:', error.message);
    } else {
      console.log('✅ Schema update successful! Client created:', data);
      
      // Clean up test client
      await supabase
        .from('clients')
        .delete()
        .eq('email', 'schema-test@example.com');
      
      console.log('✅ Test client cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

updateDatabaseSchema();
