import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch active packages with pricing information
    const { data: packages, error } = await supabase
      .from('packages')
      .select(`
        id,
        name,
        description,
        price,
        duration_minutes,
        is_active,
        features,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('price');

    if (error) {
      console.error('Error fetching packages:', error);
      return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: packages
    });

  } catch (error) {
    console.error('Error in GET /api/client/packages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
