import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Zod schemas
const createUserPackageSchema = z.object({
  client_id: z.number().int().positive('Client ID must be a positive integer'),
  package_price_id: z.number().int().positive('Package price ID must be a positive integer'),
  sessions_remaining: z.number().int().positive('Sessions remaining must be a positive integer'),
  sessions_used: z.number().int().min(0, 'Sessions used must be non-negative').default(0),
  is_active: z.boolean().default(true)
});

const updateUserPackageSchema = z.object({
  id: z.number().int().positive('User package ID must be a positive integer'),
  sessions_remaining: z.number().int().min(0, 'Sessions remaining must be non-negative').optional(),
  sessions_used: z.number().int().min(0, 'Sessions used must be non-negative').optional(),
  is_active: z.boolean().optional()
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');
    const packageType = searchParams.get('package_type');
    const isActive = searchParams.get('is_active');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build the query
    let query = supabase
      .from('user_packages')
      .select(`
        *,
        client:clients(
          id,
          name,
          email,
          phone,
          status,
          birth_date,
          birth_time,
          birth_place,
          question,
          language,
          admin_notes,
          created_at,
          updated_at
        ),
        package_definition:package_definitions(
          id,
          name,
          description,
          sessions_count,
          package_type,
          max_group_size,
          session_durations(
            id,
            name,
            duration_minutes,
            description
          )
        ),
        package_price:package_prices(
          id,
          price,
          pricing_mode,
          is_active,
          currencies(
            id,
            code,
            name,
            symbol,
            exchange_rate
          )
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (clientId && clientId !== 'all') {
      query = query.eq('client_id', clientId);
    }
    if (packageType && packageType !== 'all') {
      query = query.eq('package_definition.package_type', packageType);
    }
    if (isActive !== null && isActive !== 'all') {
      query = query.eq('is_active', isActive === 'true');
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('user_packages')
      .select('*', { count: 'exact', head: true });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: userPackages, error } = await query;

    if (error) {
      console.error('Error fetching user packages:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to fetch user packages',
        details: error.message
      }, { status: 500 });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      data: userPackages,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    const body = await request.json();
    const validation = createUserPackageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid user package data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const packageData = validation.data;

    // Check if client exists
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', packageData.client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({
        success: false,
        error: 'Client not found',
        message: 'The specified client does not exist'
      }, { status: 404 });
    }

    // Check if package price exists
    const { data: packagePrice, error: priceError } = await supabase
      .from('package_prices')
      .select('*')
      .eq('id', packageData.package_price_id)
      .eq('is_active', true)
      .single();

    if (priceError || !packagePrice) {
      return NextResponse.json({
        success: false,
        error: 'Package price not found',
        message: 'The specified package price does not exist or is not active'
      }, { status: 404 });
    }

    // Create the user package
    const { data: newUserPackage, error: createError } = await supabase
      .from('user_packages')
      .insert(packageData)
      .select(`
        *,
        client:clients(*),
        package_definition:package_definitions(
          *,
          session_durations(*)
        ),
        package_price:package_prices(
          *,
          currencies(*)
        )
      `)
      .single();

    if (createError) {
      console.error('Error creating user package:', createError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to create user package',
        details: createError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'User package created successfully',
      data: newUserPackage
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateUserPackageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid user package update data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { id, ...updateData } = validation.data;

    // Check if user package exists
    const { data: existingPackage, error: fetchError } = await supabase
      .from('user_packages')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingPackage) {
      return NextResponse.json({
        success: false,
        error: 'User package not found',
        message: 'The specified user package does not exist'
      }, { status: 404 });
    }

    // Update the user package
    const { data: updatedPackage, error: updateError } = await supabase
      .from('user_packages')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        client:clients(*),
        package_definition:package_definitions(
          *,
          session_durations(*)
        ),
        package_price:package_prices(
          *,
          currencies(*)
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating user package:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to update user package',
        details: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'User package updated successfully',
      data: updatedPackage
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing ID',
        message: 'User package ID is required'
      }, { status: 400 });
    }

    // Check if user package exists
    const { data: existingPackage, error: fetchError } = await supabase
      .from('user_packages')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingPackage) {
      return NextResponse.json({
        success: false,
        error: 'User package not found',
        message: 'The specified user package does not exist'
      }, { status: 404 });
    }

    // Check if there are active bookings
    const { data: activeBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .eq('user_package_id', id)
      .not('status', 'in', '(cancelled,completed)')
      .limit(1);

    if (bookingsError) {
      console.error('Error checking active bookings:', bookingsError);
    } else if (activeBookings && activeBookings.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete',
        message: 'Cannot delete user package with active bookings'
      }, { status: 400 });
    }

    // Delete the user package
    const { error: deleteError } = await supabase
      .from('user_packages')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting user package:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to delete user package',
        details: deleteError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'User package deleted successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    }, { status: 500 });
  }
}
