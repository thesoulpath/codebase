import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    let supabase;
    
    // Check if we have a token in the Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      supabase = await createServerClient();
      
      // Set the session manually
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
    } else {
      // No token provided, return public payment methods
      supabase = await createServerClient();
    }

    // Fetch active payment methods with currency information
    const { data: paymentMethods, error } = await supabase
      .from('payment_methods')
      .select(`
        id,
        name,
        description,
        is_active,
        currency_id,
        currencies:currency_id(
          id,
          code,
          symbol,
          name
        )
      `)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching payment methods:', error);
      return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: paymentMethods
    });

  } catch (error) {
    console.error('Error in GET /api/client/payment-methods:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
