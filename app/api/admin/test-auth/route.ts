import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Test auth endpoint - Starting...');
    
    // Test environment variables
    console.log('🔍 Environment check:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'
    });
    
    try {
      const user = await requireAuth(request);
      if (!user) {
        console.log('❌ Authentication failed - no user returned');
        return NextResponse.json({ 
          success: false,
          error: 'Authentication failed',
          message: 'No user returned from requireAuth'
        }, { status: 401 });
      }

      console.log('✅ Authentication successful:', user);
      return NextResponse.json({
        success: true,
        message: 'Authentication successful',
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });

    } catch (authError) {
      console.error('❌ Authentication error:', authError);
      return NextResponse.json({ 
        success: false,
        error: 'Authentication error',
        message: 'Exception during authentication',
        details: authError instanceof Error ? authError.message : 'Unknown auth error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Unexpected error in test auth endpoint:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
