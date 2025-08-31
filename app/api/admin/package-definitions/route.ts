import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Zod schemas
const packageDefinitionSchema = z.object({
  name: z.string().min(1, 'Package name is required').max(255, 'Package name too long'),
  description: z.string().optional(),
  sessions_count: z.number().int().positive('Sessions count must be a positive integer'),
  session_duration_id: z.number().int().positive('Session duration ID must be a positive integer'),
  package_type: z.enum(['individual', 'group', 'mixed']),
  max_group_size: z.number().int().positive().optional(),
  is_active: z.boolean().default(true)
});

const updatePackageDefinitionSchema = packageDefinitionSchema.partial().extend({
  id: z.number().int().positive('Package definition ID must be a positive integer')
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
    const packageType = searchParams.get('package_type');
    const isActive = searchParams.get('is_active');
    const sessionDurationId = searchParams.get('session_duration_id');

    // Build the query
    let query = supabase
      .from('package_definitions')
      .select(`
        *,
        session_durations (
          id,
          name,
          duration_minutes,
          description
        ),
        package_prices (
          id,
          price,
          pricing_mode,
          is_active,
          currencies (
            id,
            code,
            name,
            symbol
          )
        )
      `)
      .order('name', { ascending: true });

    // Apply filters
    if (packageType && packageType !== 'all') {
      query = query.eq('package_type', packageType);
    }
    if (isActive !== null && isActive !== 'all') {
      query = query.eq('is_active', isActive === 'true');
    }
    if (sessionDurationId && sessionDurationId !== 'all') {
      query = query.eq('session_duration_id', sessionDurationId);
    }

    const { data: packageDefinitions, error } = await query;

    if (error) {
      console.error('Error fetching package definitions:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to fetch package definitions',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: packageDefinitions
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
    const validation = packageDefinitionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid package definition data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const packageData = validation.data;

    // Validate max_group_size for group packages
    if (packageData.package_type === 'group' && !packageData.max_group_size) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Max group size is required for group packages'
      }, { status: 400 });
    }

    // Create the package definition
    const { data: newPackageDefinition, error: createError } = await supabase
      .from('package_definitions')
      .insert(packageData)
      .select(`
        *,
        session_durations (
          id,
          name,
          duration_minutes,
          description
        )
      `)
      .single();

    if (createError) {
      console.error('Error creating package definition:', createError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to create package definition',
        details: createError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Package definition created successfully',
      data: newPackageDefinition
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
    const validation = updatePackageDefinitionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid package definition update data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { id, ...updateData } = validation.data;

    // Check if package definition exists
    const { data: existingPackage, error: checkError } = await supabase
      .from('package_definitions')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existingPackage) {
      return NextResponse.json({
        success: false,
        error: 'Package definition not found',
        message: 'The specified package definition does not exist'
      }, { status: 404 });
    }

    // Validate max_group_size for group packages
    if (updateData.package_type === 'group' && !updateData.max_group_size) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Max group size is required for group packages'
      }, { status: 400 });
    }

    // Update the package definition
    const { data: updatedPackageDefinition, error: updateError } = await supabase
      .from('package_definitions')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        session_durations (
          id,
          name,
          duration_minutes,
          description
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating package definition:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to update package definition',
        details: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Package definition updated successfully',
      data: updatedPackageDefinition
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
        message: 'Package definition ID is required'
      }, { status: 400 });
    }

    // Check if package definition exists
    const { data: existingPackage, error: checkError } = await supabase
      .from('package_definitions')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existingPackage) {
      return NextResponse.json({
        success: false,
        error: 'Package definition not found',
        message: 'The specified package definition does not exist'
      }, { status: 404 });
    }

    // Check if package definition has associated prices
    const { data: packagePrices, error: pricesError } = await supabase
      .from('package_prices')
      .select('id')
      .eq('package_definition_id', id)
      .limit(1);

    if (pricesError) {
      console.error('Error checking package prices:', pricesError);
    } else if (packagePrices && packagePrices.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Package definition in use',
        message: 'Cannot delete package definition that has associated prices'
      }, { status: 400 });
    }

    // Check if package definition is being used in user packages
    const { data: usedPackages, error: usageError } = await supabase
      .from('user_packages')
      .select('id')
      .eq('package_price_id', id)
      .limit(1);

    if (usageError) {
      console.error('Error checking package usage:', usageError);
    } else if (usedPackages && usedPackages.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Package definition in use',
        message: 'Cannot delete package definition that is being used by users'
      }, { status: 400 });
    }

    // Delete the package definition
    const { error: deleteError } = await supabase
      .from('package_definitions')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting package definition:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to delete package definition',
        details: deleteError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Package definition deleted successfully'
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
