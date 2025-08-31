import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';

// GET - List all currencies
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerClient();

    const { data: currencies, error } = await supabase
      .from('currencies')
      .select('*')
      .order('code');

    if (error) {
      console.error('Error fetching currencies:', error);
      return NextResponse.json({ error: 'Failed to fetch currencies' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: currencies
    });

  } catch (error) {
    console.error('Error in GET /api/admin/currencies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new currency
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerClient();

    const body = await request.json();
    
    // Validate required fields
    if (!body.code || !body.name || !body.symbol) {
      return NextResponse.json({ error: 'Code, name, and symbol are required' }, { status: 400 });
    }

    // Create new currency
    const { data: newCurrency, error } = await supabase
      .from('currencies')
      .insert({
        code: body.code.toUpperCase(),
        name: body.name,
        symbol: body.symbol,
        is_default: body.is_default || false,
        exchange_rate: body.exchange_rate || 1.000000
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating currency:', error);
      return NextResponse.json({ error: 'Failed to create currency' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: newCurrency,
      message: 'Currency created successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/admin/currencies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
