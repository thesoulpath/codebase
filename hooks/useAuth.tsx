import { useState, useEffect } from 'react';
import { createClient } from '../lib/supabase/client';

interface User {
  email: string;
  access_token: string;
  role?: string;
  id?: string;
}

// Singleton supabase instance
const supabase = createClient();

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Admin email list - can be extended for multiple admin users
  // Add new admin emails here as needed
  const ADMIN_EMAILS = [
    'admin@soulpath.lat',
    'coco@soulpath.lat',
    'admin@matmax.world',
    'alberto@matmax.world'
  ];

  // Calculate isAdmin reactively
  const isAdmin = Boolean(user?.email && (ADMIN_EMAILS.includes(user.email) || user.role === 'admin'));
  
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 useAuth: Initial session check:', { 
        hasSession: !!session, 
        userEmail: session?.user?.email,
        role: (session?.user as any)?.role 
      });
      
      if (session?.user) {
        const userData = {
          email: session.user.email || '',
          access_token: session.access_token || '',
          id: session.user.id,
          role: (session.user as any).role
        };
        console.log('🔐 useAuth: Setting user from session:', userData);
        setUser(userData);
      } else {
        console.log('🔐 useAuth: No session found, setting user to null');
        setUser(null);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 useAuth: Auth state change:', { event, hasSession: !!session, userEmail: session?.user?.email });
        
        if (session?.user) {
          const userData = {
            email: session.user.email || '',
            access_token: session.access_token || '',
            id: session.user.id,
            role: (session.user as any).role
          };
          console.log('🔐 useAuth: Setting user from auth change:', userData);
          setUser(userData);
        } else {
          console.log('🔐 useAuth: Clearing user from auth change');
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔐 useAuth: Attempting sign in for:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('🔐 useAuth: Sign in error:', error);
    } else {
      console.log('🔐 useAuth: Sign in successful:', { user: data?.user?.email, session: !!data?.session });
    }
    
    return { data, error };
  };

  const signOut = async () => {
    console.log('🔐 useAuth: Signing out');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('🔐 useAuth: Sign out error:', error);
    }
    return { error };
  };

  console.log('🔐 useAuth: Current state:', { user: !!user, userEmail: user?.email, isAdmin, isLoading });

  return {
    user,
    isLoading,
    signIn,
    signOut,
    isAdmin
  };
}