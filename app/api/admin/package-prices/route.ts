import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Zod schemas
const packagePriceSchema = z.object({
  package_definition_id: z.number().int().positive('Package definition ID must be a positive integer'),
  currency_id: z.number().int().positive('Currency ID must be a positive integer'),
  price: z.number().min(0, 'Price must be non-negative'),
  pricing_mode: z.enum(['custom', 'calculated']),
  is_active: z.boolean().default(true)
});

const updatePackagePriceSchema = packagePriceSchema.partial().extend({
  id: z.number().int().positive('Package price ID must be a positive integer')
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
    const packageDefinitionId = searchParams.get('package_definition_id');
    const currencyId = searchParams.get('currency_id');
    const pricingMode = searchParams.get('pricing_mode');
    const isActive = searchParams.get('is_active');

    // Build the query
    let query = supabase
      .from('package_prices')
      .select(`
        *,
        package_definitions (
          id,
          name,
          sessions_count,
          package_type,
          max_group_size,
          session_durations (
            id,
            name,
            duration_minutes
          )
        ),
        currencies (
          id,
          code,
          name,
          symbol,
          exchange_rate
        )
      `)
      .order('package_definition_id', { ascending: true });

    // Apply filters
    if (packageDefinitionId && packageDefinitionId !== 'all') {
      query = query.eq('package_definition_id', packageDefinitionId);
    }
    if (currencyId && currencyId !== 'all') {
      query = query.eq('currency_id', currencyId);
    }
    if (pricingMode && pricingMode !== 'all') {
      query = query.eq('pricing_mode', pricingMode);
    }
    if (isActive !== null && isActive !== 'all') {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: packagePrices, error } = await query;

    if (error) {
      console.error('Error fetching package prices:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to fetch package prices',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: packagePrices
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
    const validation = packagePriceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid package price data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const priceData = validation.data;

    // Check if package definition exists
    const { data: packageDefinition, error: packageError } = await supabase
      .from('package_definitions')
      .select('*')
      .eq('id', priceData.package_definition_id)
      .single();

    if (packageError || !packageDefinition) {
      return NextResponse.json({
        success: false,
        error: 'Package definition not found',
        message: 'The specified package definition does not exist'
      }, { status: 404 });
    }

    // Check if currency exists
    const { data: currency, error: currencyError } = await supabase
      .from('currencies')
      .select('*')
      .eq('id', priceData.currency_id)
      .single();

    if (currencyError || !currency) {
      return NextResponse.json({
        success: false,
        error: 'Currency not found',
        message: 'The specified currency does not exist'
      }, { status: 404 });
    }

    // Check if price already exists for this package and currency
    const { data: existingPrice, error: existingError } = await supabase
      .from('package_prices')
      .select('id')
      .eq('package_definition_id', priceData.package_definition_id)
      .eq('currency_id', priceData.currency_id)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing price:', existingError);
    } else if (existingPrice) {
      return NextResponse.json({
        success: false,
        error: 'Price already exists',
        message: 'A price for this package and currency combination already exists'
      }, { status: 400 });
    }

    // If pricing mode is calculated, calculate the price based on exchange rate
    if (priceData.pricing_mode === 'calculated') {
      // Get the base currency (USD)
      const { data: baseCurrency, error: baseCurrencyError } = await supabase
        .from('currencies')
        .select('*')
        .eq('is_default', true)
        .single();

      if (baseCurrencyError || !baseCurrency) {
        return NextResponse.json({
          success: false,
          error: 'Base currency not found',
          message: 'No default currency found for price calculation'
        }, { status: 500 });
      }

      // Get the base price for this package
      const { data: basePrice, error: basePriceError } = await supabase
        .from('package_prices')
        .select('price')
        .eq('package_definition_id', priceData.package_definition_id)
        .eq('currency_id', baseCurrency.id)
        .eq('is_active', true)
        .single();

      if (basePriceError || !basePrice) {
        return NextResponse.json({
          success: false,
          error: 'Base price not found',
          message: 'No base price found for this package. Please create a price in the base currency first.'
        }, { status: 400 });
      }

      // Calculate price based on exchange rate
      const calculatedPrice = basePrice.price * (currency.exchange_rate / baseCurrency.exchange_rate);
      priceData.price = Math.round(calculatedPrice * 100) / 100; // Round to 2 decimal places
    }

    // Create the package price
    const { data: newPackagePrice, error: createError } = await supabase
      .from('package_prices')
      .insert(priceData)
      .select(`
        *,
        package_definitions (
          id,
          name,
          sessions_count,
          package_type,
          max_group_size,
          session_durations (
            id,
            name,
            duration_minutes
          )
        ),
        currencies (
          id,
          code,
          name,
          symbol,
          exchange_rate
        )
      `)
      .single();

    if (createError) {
      console.error('Error creating package price:', createError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to create package price',
        details: createError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Package price created successfully',
      data: newPackagePrice
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
    const validation = updatePackagePriceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid package price update data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { id, ...updateData } = validation.data;

    // Check if package price exists
    const { data: existingPrice, error: checkError } = await supabase
      .from('package_prices')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existingPrice) {
      return NextResponse.json({
        success: false,
        error: 'Package price not found',
        message: 'The specified package price does not exist'
      }, { status: 404 });
    }

    // If updating pricing mode to calculated, recalculate the price
    if (updateData.pricing_mode === 'calculated') {
      // Get the base currency (USD)
      const { data: baseCurrency, error: baseCurrencyError } = await supabase
        .from('currencies')
        .select('*')
        .eq('is_default', true)
        .single();

      if (baseCurrencyError || !baseCurrency) {
        return NextResponse.json({
          success: false,
          error: 'Base currency not found',
          message: 'No default currency found for price calculation'
        }, { status: 500 });
      }

      // Get the base price for this package
      const { data: basePrice, error: basePriceError } = await supabase
        .from('package_prices')
        .select('price')
        .eq('package_definition_id', existingPrice.package_definition_id)
        .eq('currency_id', baseCurrency.id)
        .eq('is_active', true)
        .single();

      if (basePriceError || !basePrice) {
        return NextResponse.json({
          success: false,
          error: 'Base price not found',
          message: 'No base price found for this package. Please create a price in the base currency first.'
        }, { status: 400 });
      }

      // Get current currency
      const { data: currency, error: currencyError } = await supabase
        .from('currencies')
        .select('*')
        .eq('id', existingPrice.currency_id)
        .single();

      if (currencyError || !currency) {
        return NextResponse.json({
          success: false,
          error: 'Currency not found',
          message: 'The specified currency does not exist'
        }, { status: 500 });
      }

      // Calculate price based on exchange rate
      const calculatedPrice = basePrice.price * (currency.exchange_rate / baseCurrency.exchange_rate);
      updateData.price = Math.round(calculatedPrice * 100) / 100; // Round to 2 decimal places
    }

    // Update the package price
    const { data: updatedPackagePrice, error: updateError } = await supabase
      .from('package_prices')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        package_definitions (
          id,
          name,
          sessions_count,
          package_type,
          max_group_size,
          session_durations (
            id,
            name,
            duration_minutes
          )
        ),
        currencies (
          id,
          code,
          name,
          symbol,
          exchange_rate
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating package price:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to update package price',
        details: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Package price updated successfully',
      data: updatedPackagePrice
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
        message: 'Package price ID is required'
      }, { status: 400 });
    }

    // Check if package price exists
    const { data: existingPrice, error: checkError } = await supabase
      .from('package_prices')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existingPrice) {
      return NextResponse.json({
        success: false,
        error: 'Package price not found',
        message: 'The specified package price does not exist'
      }, { status: 404 });
    }

    // Check if package price is being used in user packages
    const { data: usedPackages, error: usageError } = await supabase
      .from('user_packages')
      .select('id')
      .eq('package_price_id', id)
      .limit(1);

    if (usageError) {
      console.error('Error checking package price usage:', usageError);
    } else if (usedPackages && usedPackages.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Package price in use',
        message: 'Cannot delete package price that is being used by users'
      }, { status: 400 });
    }

    // Delete the package price
    const { error: deleteError } = await supabase
      .from('package_prices')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting package price:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to delete package price',
        details: deleteError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Package price deleted successfully'
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
