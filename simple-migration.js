const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function simpleMigration() {
  console.log('🚀 Starting simple migration...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // First, let's try to create a simple client with basic fields
    console.log('📝 Testing basic client creation...');
    const basicClient = {
      name: 'Test Client',
      email: 'test@example.com',
      phone: '+1234567890',
      status: 'active'
    };

    const { data: basicResult, error: basicError } = await supabase
      .from('clients')
      .insert(basicClient)
      .select()
      .single();

    if (basicError) {
      console.error('❌ Basic client creation failed:', basicError.message);
      console.log('🔍 This suggests the table structure is different than expected');
      return;
    }

    console.log('✅ Basic client created successfully:', basicResult);

    // Now let's try to update it with additional fields
    console.log('🔄 Testing field updates...');
    const updateData = {
      birth_date: '1990-01-01',
      birth_place: 'Test City',
      question: 'Test question',
      language: 'en'
    };

    const { data: updateResult, error: updateError } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', basicResult.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Field update failed:', updateError.message);
      console.log('🔍 This means the columns don\'t exist yet');
      
      // Let's check what columns we can actually update
      console.log('🔍 Checking what fields can be updated...');
      const { data: currentClient, error: selectError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', basicResult.id)
        .single();

      if (selectError) {
        console.error('❌ Error selecting updated client:', selectError.message);
      } else {
        console.log('📋 Current client data:', currentClient);
        console.log('📊 Available fields:', Object.keys(currentClient));
      }
    } else {
      console.log('✅ Field update successful:', updateResult);
    }

    // Clean up test client
    console.log('🧹 Cleaning up test client...');
    const { error: deleteError } = await supabase
      .from('clients')
      .delete()
      .eq('id', basicResult.id);

    if (deleteError) {
      console.log('⚠️  Could not delete test client:', deleteError.message);
    } else {
      console.log('✅ Test client cleaned up');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

simpleMigration();
