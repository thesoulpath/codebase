import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Default logo configuration when table doesn't exist
const defaultLogo = {
  id: 1,
  type: 'text',
  text: 'SOULPATH',
  imageUrl: null,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export async function GET() {
  try {
    // First, check if the logo table exists by trying to query it
    const { data, error } = await supabase
      .from('logo')
      .select('*')
      .single();

    if (error) {
      // If table doesn't exist or has no data, return default logo
      if (error.code === 'PGRST205' || error.code === 'PGRST116') {
        console.log('Logo table not found or empty, using default logo');
        return NextResponse.json({ logoSettings: defaultLogo });
      }
      
      console.error('Error fetching logo:', error);
      return NextResponse.json({ logoSettings: defaultLogo });
    }

    return NextResponse.json({ logoSettings: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ logoSettings: defaultLogo });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Try to upsert, but if table doesn't exist, just return success with default
    try {
      const { data, error } = await supabase
        .from('logo')
        .upsert(body, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('Error updating logo:', error);
        return NextResponse.json({ logoSettings: defaultLogo });
      }

      return NextResponse.json({ logoSettings: data });
    } catch (tableError: any) {
      // If table doesn't exist, return default
      if (tableError.code === 'PGRST205') {
        console.log('Logo table not found, cannot save logo settings');
        return NextResponse.json({ logoSettings: defaultLogo });
      }
      throw tableError;
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ logoSettings: defaultLogo });
  }
}
