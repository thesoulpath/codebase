const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkDatabaseStructure() {
  console.log('🔍 Checking database structure...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Check if clients table exists and get its structure
    console.log('📋 Checking clients table...');
    const { data: clients, error: selectError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);

    if (selectError) {
      console.error('❌ Error selecting from clients:', selectError.message);
      
      // Try to get table info
      console.log('🔍 Trying to get table info...');
      const { data: tableInfo, error: tableError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'clients')
        .eq('table_schema', 'public');

      if (tableError) {
        console.error('❌ Error getting table info:', tableError.message);
      } else {
        console.log('📊 Table structure:');
        tableInfo?.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
      }
    } else if (clients && clients.length > 0) {
      const client = clients[0];
      console.log('✅ Clients table exists and has data!');
      console.log('📋 Available fields:', Object.keys(client));
      console.log('📊 Sample client data:', client);
    } else {
      console.log('⚠️  Clients table exists but is empty');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkDatabaseStructure();
