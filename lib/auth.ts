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
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    // Check if user is admin
    if (user.user_metadata?.role !== 'admin') {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      role: user.user_metadata?.role || 'admin'
    };
  } catch (error) {
    console.error('Auth middleware error:', error);
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
