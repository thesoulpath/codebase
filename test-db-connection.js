const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('Testing database connection...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('Service Role Key:', supabaseKey ? '✅ Set' : '❌ Missing');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connection
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      
      // Check if table exists
      if (error.message.includes('relation "clients" does not exist')) {
        console.log('❌ Clients table does not exist. You need to run the database migration.');
        console.log('💡 Try: npx supabase db push');
      }
    } else {
      console.log('✅ Database connection successful');
      
      if (data && data.length > 0) {
        console.log('✅ Table query successful');
        console.log('Table columns:', Object.keys(data[0]));
        console.log('Sample data:', data[0]);
      } else {
        console.log('✅ Table exists but is empty');
        console.log('Table columns:', Object.keys(data[0] || {}));
      }
    }
    
    // Try to get table info
    try {
      const { data: tableInfo, error: tableError } = await supabase
        .rpc('get_table_info', { table_name: 'clients' });
      
      if (!tableError) {
        console.log('Table info:', tableInfo);
      }
    } catch (e) {
      // RPC might not exist, that's okay
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testConnection();
