import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: string;
}

export async function requireAuth(request: NextRequest): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Auth: No Authorization header or invalid format');
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('Auth: Token received, length:', token.length);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.log('Auth: Supabase auth error:', error.message);
      return null;
    }
    
    if (!user) {
      console.log('Auth: No user returned from Supabase');
      return null;
    }

    console.log('Auth: User authenticated:', user.email, 'Role:', user.user_metadata?.role);

    // Check if user is admin by email first (more reliable)
    const isAdminByEmail = user.email && [
      'admin@soulpath.lat',
      'coco@soulpath.lat',
      'admin@matmax.world',
      'alberto@matmax.world'
    ].includes(user.email);

    // Also check by role metadata (fallback)
    const isAdminByRole = user.user_metadata?.role === 'admin';

    if (!isAdminByEmail && !isAdminByRole) {
      console.log('Auth: User is not admin, email:', user.email, 'role:', user.user_metadata?.role);
      return null;
    }

    console.log('Auth: User is admin by', isAdminByEmail ? 'email' : 'role');

    return {
      id: user.id,
      email: user.email!,
      role: user.user_metadata?.role || 'admin'
    };
  } catch (error) {
    console.log('Auth: Unexpected error:', error);
    return null;
  }
}

export async function requireAuthResponse(request: NextRequest): Promise<NextResponse | null> {
  const user = await requireAuth(request);
  
  if (!user) {
    return NextResponse.json({ 
      code: 401, 
      message: 'Missing or invalid authorization',
      error: 'Authorization required' 
    }, { status: 401 });
  }
  
  return null; // Continue with the request
}

export function createAuthMiddleware(handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const user = await requireAuth(request);
    
    if (!user) {
      return NextResponse.json({ 
        code: 401, 
        message: 'Missing or invalid authorization',
        error: 'Authorization required' 
      }, { status: 401 });
    }
    
    return handler(request, user);
  };
}
