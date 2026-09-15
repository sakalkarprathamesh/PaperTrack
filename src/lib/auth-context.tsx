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

// Demo users are only exposed in non-production environments when explicitly enabled
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
    email: 'anand@papertrack.com',
    fullName: 'Anand Kulkarni (Customer)',
    role: 'CUSTOMER',
    customerId: '10000000-0000-0000-0000-000000000001',
  },
};

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password?: string) => Promise<{ success: boolean; role: UserRole }>;
  logout: () => Promise<void>;
  switchDemoUser: (key: 'admin' | 'delivery' | 'customer') => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeRole(roleStr?: string): UserRole {
  const lower = (roleStr || '').toLowerCase();
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
    document.cookie = `papertrack_role=; path=/; max-age=0; SameSite=Lax`;
    document.cookie = `papertrack_user_id=; path=/; max-age=0; SameSite=Lax`;
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

  // Initialize session from Supabase in production, or fallback to dev session
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const { data: { user: authUser } } = await supabase.auth.getUser();

          if (authUser && isMounted) {
            // Fetch verified profile from database
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, full_name, role, phone')
              .eq('id', authUser.id)
              .single();

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
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // Fall through to unauthenticated
        }
      }

      // If in development mode and Supabase is not yet configured, check local dev session
      if (process.env.NODE_ENV !== 'production') {
        try {
          const saved = localStorage.getItem('papertrack_session');
          if (saved) {
            const parsed = JSON.parse(saved);
            setUser(parsed);
            syncAuthCookies(parsed);
            setIsLoading(false);
            return;
          }
        } catch {
          // Ignore local parse issues
        }
      }

      // In production or when unauthenticated, default to null
      setUser(null);
      syncAuthCookies(null);
      setIsLoading(false);
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password?: string): Promise<{ success: boolean; role: UserRole }> => {
    // 1. Production Authentication via Supabase
    if (isSupabaseConfigured() && password) {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Invalid email or password.');
      }

      // Fetch user profile from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, role, phone')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('User profile not found. Please contact the agency administrator.');
      }

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

      const authUser: AuthUser = {
        id: profile.id,
        email: authData.user.email || email,
        fullName: profile.full_name,
        role: userRole,
        customerId,
        deliveryBoyId,
      };

      setUser(authUser);
      syncAuthCookies(authUser);
      return { success: true, role: authUser.role };
    }

    // 2. Development-Only Offline Fallback (strictly disabled in production)
    if (process.env.NODE_ENV !== 'production') {
      let matched = Object.values(DEMO_USERS).find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!matched) {
        const role: UserRole = email.includes('delivery')
          ? 'DELIVERY_BOY'
          : email.includes('customer')
          ? 'CUSTOMER'
          : 'ADMIN';
        matched = {
          id: `usr-${Date.now()}`,
          email,
          fullName: email.split('@')[0],
          role,
          customerId: role === 'CUSTOMER' ? '10000000-0000-0000-0000-000000000001' : undefined,
          deliveryBoyId: role === 'DELIVERY_BOY' ? 'd0000000-0000-0000-0000-000000000001' : undefined,
        };
      }
      setUser(matched);
      syncAuthCookies(matched);
      localStorage.setItem('papertrack_session', JSON.stringify(matched));
      return { success: true, role: matched.role };
    }

    throw new Error('Supabase authentication is required in production. Please provide email and password.');
  }, []);

  const switchDemoUser = useCallback((key: 'admin' | 'delivery' | 'customer') => {
    // Only permitted in non-production environments
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_ENABLE_DEMO_SWITCHER !== 'true') {
      return;
    }
    const selected = DEMO_USERS[key];
    setUser(selected);
    syncAuthCookies(selected);
    try {
      localStorage.setItem('papertrack_session', JSON.stringify(selected));
    } catch {
      // Ignore
    }
  }, []);

  const logout = useCallback(async () => {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        // Ignore sign-out errors
      }
    }
    setUser(null);
    syncAuthCookies(null);
    try {
      localStorage.removeItem('papertrack_session');
    } catch {
      // Ignore
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, switchDemoUser, isLoading }}>
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
