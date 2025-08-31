import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Looking for client profile for:', user.email);

    // First, let's check if there are multiple profiles (this shouldn't happen but let's be safe)
    const { data: allProfiles, error: checkError } = await supabase
      .from('clients')
      .select('id, email, name, created_at')
      .eq('email', user.email)
      .order('created_at', { ascending: false });

    if (checkError) {
      console.error('❌ Error checking for profiles:', checkError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (allProfiles && allProfiles.length > 1) {
      console.warn('⚠️  Multiple profiles found for email:', user.email, 'Count:', allProfiles.length);
      // Use the most recent profile
      const latestProfile = allProfiles[0];
      console.log('📋 Using most recent profile:', latestProfile);
    }

    // Use a more robust approach: try to get the profile first, and only create if it doesn't exist
    let { data: profile, error: profileError } = await supabase
      .from('clients')
      .select('*')
      .eq('email', user.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // If profile exists, return it immediately
    if (profile && !profileError) {
      console.log('✅ Found existing client profile:', profile);
      return NextResponse.json(profile);
    }

    // If we get here, either the profile doesn't exist or there was an error
    if (profileError) {
      // Check if it's a "no rows" error (profile doesn't exist)
      if (profileError.code === 'PGRST116') {
        console.log('📝 No profile found, creating basic client profile for:', user.email);
        
        // Use UPSERT (INSERT ... ON CONFLICT) to handle race conditions
        const { data: newProfile, error: upsertError } = await supabase
          .from('clients')
          .upsert({
            email: user.email,
            name: user.user_metadata?.name || 'New Client',
            phone: null,
            birth_date: '1990-01-01', // Default date
            birth_time: null,
            birth_place: 'Not specified',
            question: 'Profile created automatically',
            language: 'en',
            status: 'active',
            notes: null,
            admin_notes: null,
            scheduled_date: null,
            scheduled_time: null,
            session_type: null,
            last_reminder_sent: null,
            last_booking: null
          }, {
            onConflict: 'email',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (upsertError) {
          console.error('❌ Error upserting client profile:', upsertError);
          
          // If upsert fails, try to get the existing profile one more time
          console.log('🔄 Upsert failed, trying to fetch existing profile...');
          const { data: existingProfile, error: fetchError } = await supabase
            .from('clients')
            .select('*')
            .eq('email', user.email)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (fetchError) {
            console.error('❌ Error fetching existing profile after upsert failure:', fetchError);
            return NextResponse.json({ 
              error: 'Failed to create or fetch client profile',
              details: upsertError.message 
            }, { status: 500 });
          }

          console.log('✅ Retrieved existing profile after upsert failure:', existingProfile);
          return NextResponse.json(existingProfile);
        }

        console.log('✅ Created/Updated client profile:', newProfile);
        return NextResponse.json(newProfile);
      } else {
        // Some other error occurred
        console.error('❌ Error fetching profile:', profileError);
        return NextResponse.json({ 
          error: 'Failed to fetch profile',
          details: profileError.message 
        }, { status: 500 });
      }
    }

    // This should never happen, but just in case
    console.error('❌ Unexpected state: no profile and no error');
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
    
  } catch (error) {
    console.error('❌ Error in GET /api/client/me:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Prepare update data - only allow editing of specific fields
    const updateData = {
      name: body.name,
      phone: body.phone || null,
      birth_date: body.birth_date || null,
      birth_time: body.birth_time || null,
      birth_place: body.birth_place || null,
      question: body.question || null,
      language: body.language || 'en',
      notes: body.notes || null,
      updated_at: new Date().toISOString()
    };

    // Update the client profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('clients')
      .update(updateData)
      .eq('email', user.email)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error in PUT /api/client/me:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
