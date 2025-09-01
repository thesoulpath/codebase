import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';

// GET - List all payment methods
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerClient();

    // Fetch all payment methods with currency information
    const { data: paymentMethods, error } = await supabase
      .from('payment_method_configs')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching payment methods:', error);
      return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
    }

    // Transform the data to match the expected frontend format
    const transformedData = paymentMethods?.map(method => ({
      id: method.id,
      name: method.name,
      type: method.type || 'custom',
      description: method.description,
      icon: method.icon || '',
      requiresConfirmation: method.requires_confirmation || false,
      autoAssignPackage: method.auto_assign_package !== undefined ? method.auto_assign_package : true,
      isActive: method.is_active,
      stripeConfig: null, // TODO: Implement stripe config storage
      createdAt: method.created_at,
      updatedAt: method.updated_at
    })) || [];

    return NextResponse.json({
      success: true,
      data: transformedData
    });

  } catch (error) {
    console.error('Error in GET /api/admin/payment-methods:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new payment method
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerClient();

    // Get the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Create new payment method
    const { data: newPaymentMethod, error } = await supabase
      .from('payment_method_configs')
      .insert({
        name: body.name,
        type: body.type || 'custom',
        description: body.description || null,
        icon: body.icon || null,
        requires_confirmation: body.requiresConfirmation !== undefined ? body.requiresConfirmation : false,
        auto_assign_package: body.autoAssignPackage !== undefined ? body.autoAssignPackage : true,
        is_active: body.isActive !== undefined ? body.isActive : true
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating payment method:', error);
      return NextResponse.json({ error: 'Failed to create payment method' }, { status: 500 });
    }

    // Transform the response to match expected format
    const transformedData = {
      id: newPaymentMethod.id,
      name: newPaymentMethod.name,
      type: newPaymentMethod.type || 'custom',
      description: newPaymentMethod.description,
      icon: newPaymentMethod.icon || '',
      requiresConfirmation: newPaymentMethod.requires_confirmation || false,
      autoAssignPackage: newPaymentMethod.auto_assign_package !== undefined ? newPaymentMethod.auto_assign_package : true,
      isActive: newPaymentMethod.is_active,
      stripeConfig: null, // TODO: Implement stripe config storage
      createdAt: newPaymentMethod.created_at,
      updatedAt: newPaymentMethod.updated_at
    };

    return NextResponse.json({
      success: true,
      data: transformedData,
      message: 'Payment method created successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/admin/payment-methods:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createServerClient();

    const body = await request.json();
    const { id, name, type, description, icon, requiresConfirmation, autoAssignPackage, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (requiresConfirmation !== undefined) updateData.requires_confirmation = requiresConfirmation;
    if (autoAssignPackage !== undefined) updateData.auto_assign_package = autoAssignPackage;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data, error } = await supabase
      .from('payment_method_configs')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating payment method:', error);
      return NextResponse.json(
        { error: 'Failed to update payment method' },
        { status: 500 }
      );
    }

    // Transform the response to match expected format
    const transformedData = {
      id: data.id,
      name: data.name,
      type: data.type || 'custom',
      description: data.description,
      icon: data.icon || '',
      requiresConfirmation: data.requires_confirmation || false,
      autoAssignPackage: data.auto_assign_package !== undefined ? data.auto_assign_package : true,
      isActive: data.is_active,
      stripeConfig: null, // TODO: Implement stripe config storage
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    return NextResponse.json({ data: transformedData });
  } catch (error) {
    console.error('Error in payment methods PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createServerClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Check if payment method is being used
    const { data: usageData, error: usageError } = await supabase
      .from('payment_records')
      .select('id')
      .eq('payment_method', id)
      .limit(1);

    if (usageError) {
      console.error('Error checking payment method usage:', usageError);
      return NextResponse.json(
        { error: 'Failed to check payment method usage' },
        { status: 500 }
      );
    }

    if (usageData && usageData.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete payment method that is being used' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('payment_method_configs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting payment method:', error);
      return NextResponse.json(
        { error: 'Failed to delete payment method' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in payment methods DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
