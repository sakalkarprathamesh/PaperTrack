'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRole } from './types';
import { createClient } from './supabase/client';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  customerId?: string;
  deliveryBoyId?: string;
}

export const DEMO_USERS: Record<string, AuthUser> = {
  admin: {
    id: 'a0000000-0000-0000-0000-000000000001',
    email: 'sakalkarashok77@gmail.com',
    fullName: 'Admin (Agency Owner)',
    role: 'ADMIN',
  },
  delivery: {
    id: 'b0000000-0000-0000-0000-000000000001',
    email: 'ramesh@papertrack.com',
    fullName: 'Ramesh Shinde (Delivery Staff)',
    role: 'DELIVERY_BOY',
    deliveryBoyId: 'd0000000-0000-0000-0000-000000000001',
  },
  customer: {
    id: 'c0000000-0000-0000-0000-000000000001',
    email: '919822111001@papertrack.com',
    fullName: 'Anand Kulkarni (Customer)',
    role: 'CUSTOMER',
    customerId: '10000000-0000-0000-0000-000000000001',
  },
};

interface AuthContextType {
  user: AuthUser | null;
  login: (identifier: string, password?: string, mode?: 'admin' | 'customer') => Promise<{ success: boolean; role: UserRole }>;
  logout: () => Promise<void>;
  switchDemoUser: (key: 'admin' | 'delivery' | 'customer') => void;
  isLoading: boolean;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeRole(roleStr?: string): UserRole {
  const lower = (roleStr || '').toLowerCase().trim();
  if (lower === 'admin') return 'ADMIN';
  if (lower === 'delivery_boy' || lower === 'delivery') return 'DELIVERY_BOY';
  return 'CUSTOMER';
}

function syncAuthCookies(authUser: AuthUser | null) {
  if (typeof document === 'undefined') return;
  if (authUser) {
    document.cookie = `papertrack_role=${authUser.role}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `papertrack_user_id=${authUser.id}; path=/; max-age=604800; SameSite=Lax`;
  } else {
    document.cookie = `papertrack_role=; path=/; max-age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `papertrack_user_id=; path=/; max-age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes('placeholder') && !key.includes('placeholder'));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session and listen for auth state changes to preserve session on refresh
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();

          // Check current active session
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user && isMounted) {
            await resolveAndSetUser(session.user);
            setIsLoading(false);
            return;
          }

          // Subscribe to ongoing auth state events (sign in, sign out, token refresh)
          const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if (!isMounted) return;
            if (currentSession?.user) {
              await resolveAndSetUser(currentSession.user);
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              syncAuthCookies(null);
            }
          });

          return () => {
            authListener.subscription.unsubscribe();
          };
        } catch (err) {
          console.error('Supabase auth initialization error:', err);
        }
      }

      // Offline/Local Development fallback session (disabled in production)
      if (process.env.NODE_ENV !== 'production') {
        try {
          const saved = localStorage.getItem('papertrack_session');
          if (saved && isMounted) {
            const parsed = JSON.parse(saved);
            setUser(parsed);
            syncAuthCookies(parsed);
            setIsLoading(false);
            return;
          }
        } catch {
          // Ignore parse issues
        }
      }

      if (isMounted) {
        setUser(null);
        syncAuthCookies(null);
        setIsLoading(false);
      }
    }

    async function resolveAndSetUser(authUser: any) {
      try {
        const supabase = createClient();
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, role, phone')
          .eq('id', authUser.id)
          .maybeSingle();

        if (profile) {
          const userRole = normalizeRole(profile.role);
          let customerId: string | undefined;
          let deliveryBoyId: string | undefined;

          if (userRole === 'CUSTOMER') {
            const { data: cust } = await supabase
              .from('customers')
              .select('id')
              .eq('profile_id', profile.id)
              .maybeSingle();
            customerId = cust?.id;
          } else if (userRole === 'DELIVERY_BOY') {
            const { data: staff } = await supabase
              .from('delivery_boys')
              .select('id')
              .eq('profile_id', profile.id)
              .maybeSingle();
            deliveryBoyId = staff?.id;
          }

          const resolvedUser: AuthUser = {
            id: profile.id,
            email: authUser.email || '',
            fullName: profile.full_name,
            role: userRole,
            customerId,
            deliveryBoyId,
          };

          setUser(resolvedUser);
          syncAuthCookies(resolvedUser);
          return;
        }

        // If user is Admin email but profile row was missing, auto-create it
        const normalizedEmail = (authUser.email || '').toLowerCase().trim();
        if (normalizedEmail === 'sakalkarashok77@gmail.com') {
          await supabase.from('profiles').upsert({
            id: authUser.id,
            full_name: 'Admin (Agency Owner)',
            role: 'admin',
          });

          const adminUser: AuthUser = {
            id: authUser.id,
            email: authUser.email,
            fullName: 'Admin (Agency Owner)',
            role: 'ADMIN',
          };
          setUser(adminUser);
          syncAuthCookies(adminUser);
          return;
        }
      } catch (e) {
        console.error('Error resolving user profile:', e);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(
    async (
      identifier: string,
      password?: string,
      mode: 'admin' | 'customer' = 'admin'
    ): Promise<{ success: boolean; role: UserRole }> => {
      const cleanIdentifier = identifier.trim();
      const cleanPassword = (password || '').trim();

      if (!cleanIdentifier || !cleanPassword) {
        throw new Error('Please enter both your credentials and password.');
      }

      // Format target email based on login mode
      let targetEmails: string[] = [];

      if (mode === 'customer') {
        if (cleanIdentifier.includes('@')) {
          targetEmails = [cleanIdentifier.toLowerCase()];
        } else {
          const digits = cleanIdentifier.replace(/[^0-9]/g, '');
          if (!digits) {
            throw new Error('Please enter a valid numeric Login ID.');
          }
          targetEmails.push(`${digits}@papertrack.com`);
          // If customer entered 10 digits without Indian country code 91, also support 91 prefix
          if (digits.length === 10) {
            targetEmails.push(`91${digits}@papertrack.com`);
          } else if (digits.length === 12 && digits.startsWith('91')) {
            targetEmails.push(`${digits.slice(2)}@papertrack.com`);
          }
        }
      } else {
        targetEmails = [cleanIdentifier.toLowerCase()];
      }

      // 1. Supabase Authentication (Production)
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        let authData: any = null;
        let lastError: any = null;

        for (const candidateEmail of targetEmails) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: candidateEmail,
            password: cleanPassword,
          });

          if (!error && data?.user) {
            authData = data;
            break;
          }
          lastError = error;
        }

        if (!authData?.user) {
          // Generic security error message (does not leak account existence)
          throw new Error('Invalid login credentials. Please check your details and try again.');
        }

        // Query database profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, role, phone')
          .eq('id', authData.user.id)
          .maybeSingle();

        // Handle profile mapping
        let userRole: UserRole = 'ADMIN';
        let fullName = 'Admin (Agency Owner)';
        let customerId: string | undefined;
        let deliveryBoyId: string | undefined;

        if (profile) {
          userRole = normalizeRole(profile.role);
          fullName = profile.full_name;

          if (userRole === 'CUSTOMER') {
            const { data: cust } = await supabase
              .from('customers')
              .select('id')
              .or(`profile_id.eq.${profile.id},phone.ilike.%${cleanIdentifier}%`)
              .maybeSingle();
            customerId = cust?.id;
          } else if (userRole === 'DELIVERY_BOY') {
            const { data: staff } = await supabase
              .from('delivery_boys')
              .select('id')
              .eq('profile_id', profile.id)
              .maybeSingle();
            deliveryBoyId = staff?.id;
          }
        } else {
          // If user logged in as admin email without profile, create admin profile
          if (authData.user.email?.toLowerCase() === 'sakalkarashok77@gmail.com' || mode === 'admin') {
            userRole = 'ADMIN';
            fullName = 'Admin (Agency Owner)';
            await supabase.from('profiles').upsert({
              id: authData.user.id,
              full_name: fullName,
              role: 'admin',
            });
          } else {
            throw new Error('Invalid login credentials. Please check your details and try again.');
          }
        }

        const authUser: AuthUser = {
          id: authData.user.id,
          email: authData.user.email || targetEmails[0],
          fullName,
          role: userRole,
          customerId,
          deliveryBoyId,
        };

        setUser(authUser);
        syncAuthCookies(authUser);
        return { success: true, role: userRole };
      }

      // 2. Development-Only Offline Fallback (when Supabase credentials not yet supplied)
      if (process.env.NODE_ENV !== 'production') {
        let matched: AuthUser | undefined;

        if (mode === 'admin' && (cleanIdentifier === 'sakalkarashok77@gmail.com' || cleanIdentifier === 'admin@papertrack.com')) {
          matched = DEMO_USERS.admin;
        } else if (mode === 'customer') {
          matched = DEMO_USERS.customer;
        }

        if (!matched) {
          const role: UserRole = mode === 'customer' ? 'CUSTOMER' : 'ADMIN';
          matched = {
            id: `usr-${Date.now()}`,
            email: targetEmails[0],
            fullName: mode === 'customer' ? 'Subscriber' : 'Admin (Agency Owner)',
            role,
            customerId: mode === 'customer' ? '10000000-0000-0000-0000-000000000001' : undefined,
          };
        }

        setUser(matched);
        syncAuthCookies(matched);
        try {
          localStorage.setItem('papertrack_session', JSON.stringify(matched));
        } catch {}
        return { success: true, role: matched.role };
      }

      throw new Error(
        'Database connection is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your Vercel Project Settings.'
      );
    },
    []
  );

  const switchDemoUser = useCallback((key: 'admin' | 'delivery' | 'customer') => {
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_ENABLE_DEMO_SWITCHER !== 'true') {
      return;
    }
    const selected = DEMO_USERS[key];
    setUser(selected);
    syncAuthCookies(selected);
    try {
      localStorage.setItem('papertrack_session', JSON.stringify(selected));
    } catch {}
  }, []);

  const logout = useCallback(async () => {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Supabase signOut error:', err);
      }
    }
    setUser(null);
    syncAuthCookies(null);
    try {
      localStorage.removeItem('papertrack_session');
    } catch {}
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        switchDemoUser,
        isLoading,
        isConfigured: isSupabaseConfigured(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
