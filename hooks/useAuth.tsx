import { useState, useEffect } from 'react';
import { createClient } from '../lib/supabase/client';

interface User {
  id: string;
  email: string;
  user_metadata: any;
  access_token?: string;
}

// Singleton supabase instance
const supabase = createClient();

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          ...session.user as User,
          access_token: session.access_token
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        if (session?.user) {
          setUser({
            ...session.user as User,
            access_token: session.access_token
          });
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    isLoading,
    signIn,
    signOut,
    isAdmin: user?.email === 'admin@soulpath.lat' || user?.user_metadata?.role === 'admin'
  };
}