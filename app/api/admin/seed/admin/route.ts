import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // Create admin user with email "coco@soulpath.lat" and password "soulpath2025!"
    const { data: user, error } = await supabase.auth.admin.createUser({
      email: 'coco@soulpath.lat',
      password: 'soulpath2025!',
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        full_name: 'Coco Peru Admin'
      }
    });

    if (error) {
      console.error('Error creating admin user:', error);
      return NextResponse.json({ 
        error: 'Failed to create admin user',
        details: error.message 
      }, { status: 500 });
    }

    // Also create a profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.user.id,
        email: user.user.email,
        full_name: 'Coco Peru Admin',
        role: 'admin'
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Don't fail the request if profile creation fails
    }

    return NextResponse.json({ 
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: user.user.id,
        email: user.user.email,
        role: 'admin'
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
