const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testCreateClient() {
  console.log('Testing client creation...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Try to create a minimal client
    const testClient = {
      name: 'Test Client',
      email: 'test@example.com',
      phone: '+1234567890',
      status: 'active',
      birth_date: '1990-01-01',
      birth_place: 'Test City, Test Country',
      question: 'Test question for development purposes',
      language: 'en',
      created_at: new Date().toISOString()
    };
    
    console.log('Attempting to create client with data:', testClient);
    
    const { data, error } = await supabase
      .from('clients')
      .insert(testClient)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating client:', error);
      console.error('Error details:', error.message);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
    } else {
      console.log('✅ Client created successfully:', data);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testCreateClient();
