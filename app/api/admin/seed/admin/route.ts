import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Zod schema for admin user creation
const adminUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(1, 'Full name is required'),
  role: z.enum(['admin', 'user']).default('admin')
});

export async function POST() {
  try {
    // Validate admin user data
    const adminData = {
      email: 'beto@soulpath.com',
      password: 'beto2025!',
      full_name: 'Beto Admin',
      role: 'admin' as const
    };

    const validationResult = adminUserSchema.safeParse(adminData);
    if (!validationResult.success) {
      console.error('Validation error:', (validationResult as any).error.errors);
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Admin user data validation failed',
        details: (validationResult as any).error.errors,
        toast: {
          type: 'error',
          title: 'Validation Error',
          description: 'Admin user data validation failed. Please check the data format.'
        }
      }, { status: 400 });
    }

    // Create admin user with email "coco@soulpath.lat" and password "soulpath2025!"
    const { data: user, error } = await supabase.auth.admin.createUser({
      email: adminData.email,
      password: adminData.password,
      email_confirm: true,
      user_metadata: {
        role: adminData.role,
        full_name: adminData.full_name
      }
    });

    if (error) {
      console.error('Error creating admin user:', error);
      return NextResponse.json({
        success: false,
        error: 'User creation failed',
        message: 'Failed to create admin user',
        details: error.message,
        toast: {
          type: 'error',
          title: 'User Creation Failed',
          description: 'Failed to create admin user. Please try again.'
        }
      }, { status: 500 });
    }

    // Also create a profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.user.id,
        email: user.user.email,
        full_name: adminData.full_name,
        role: adminData.role
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
        role: adminData.role
      },
      toast: {
        type: 'success',
        title: 'Success!',
        description: `Admin user ${adminData.email} created successfully`
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      toast: {
        type: 'error',
        title: 'Unexpected Error',
        description: 'An unexpected error occurred. Please try again.'
      }
    }, { status: 500 });
  }
}
