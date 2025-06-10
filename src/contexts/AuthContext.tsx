
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    console.log('Attempting sign up for:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    console.log('Sign up result:', { data, error });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in for:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    console.log('Sign in result:', { data, error });
    return { error };
  };

  const signOut = async () => {
    console.log('Attempting sign out');
    try {
      // Sign out from Supabase first
      const { error } = await supabase.auth.signOut();
      console.log('Sign out result:', { error });
      
      if (error) {
        console.error('Supabase sign out error:', error);
        
        // If the session is already invalid/missing, treat it as a successful sign out
        if (error.message?.includes('Auth session missing') || 
            error.message?.includes('Session from session_id claim in JWT does not exist') ||
            error.status === 403) {
          console.log('Session already invalid, treating as successful sign out');
          // Clear local state manually since the session is already gone
          setUser(null);
          setSession(null);
          return { error: null };
        }
        
        return { error };
      }
      
      // Only clear local state if Supabase signOut was successful
      // The onAuthStateChange listener will handle this automatically
      return { error: null };
    } catch (err) {
      console.error('Unexpected sign out error:', err);
      return { error: err };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
