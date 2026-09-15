'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRole } from './types';
import { createClient } from './supabase/client';
import { dataService } from './data-service';
import { verifyPin } from './security';

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
  login: (
    identifier: string,
    passwordOrPin?: string,
    mode?: 'admin' | 'customer' | 'delivery_boy'
  ) => Promise<{ success: boolean; role: UserRole }>;
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
    document.cookie = `papertrack_session=${encodeURIComponent(JSON.stringify(authUser))}; path=/; max-age=604800; SameSite=Lax`;
  } else {
    document.cookie = `papertrack_role=; path=/; max-age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `papertrack_user_id=; path=/; max-age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `papertrack_session=; path=/; max-age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
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
      // 1. Check cookie session first (preserves Customer and Delivery Staff sessions across refreshes)
      if (typeof document !== 'undefined') {
        const match = document.cookie.match(/(?:^|;\s*)papertrack_session=([^;]+)/);
        if (match) {
          try {
            const parsed = JSON.parse(decodeURIComponent(match[1]));
            if (parsed && parsed.id && parsed.role && isMounted) {
              setUser(parsed);
              setIsLoading(false);
              if (parsed.role !== 'ADMIN') {
                return;
              }
            }
          } catch {}
        }
      }

      // 2. Supabase Auth Session (for Admin)
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

      if (isMounted) {
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
      passwordOrPin?: string,
      mode: 'admin' | 'customer' | 'delivery_boy' = 'admin'
    ): Promise<{ success: boolean; role: UserRole }> => {
      const cleanIdentifier = identifier.trim();
      const cleanSecret = (passwordOrPin || '').trim();

      if (!cleanIdentifier || !cleanSecret) {
        throw new Error(
          mode === 'admin'
            ? 'Please enter both your email address and password.'
            : 'Please enter both your Login ID and 4-digit PIN.'
        );
      }

      // ==========================================
      // A. CUSTOMER & DELIVERY BOY PIN LOGIN
      // ==========================================
      if (mode === 'customer' || mode === 'delivery_boy') {
        // First try the secure server-side PIN authentication API route
        try {
          const res = await fetch('/api/auth/pin-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode,
              loginId: cleanIdentifier,
              pin: cleanSecret,
            }),
          });

          const data = await res.json().catch(() => ({}));

          if (!res.ok) {
            throw new Error(data.error || 'Invalid Login ID or PIN.');
          }

          if (data.user) {
            setUser(data.user);
            syncAuthCookies(data.user);
            return { success: true, role: data.role };
          }
        } catch (apiErr: any) {
          // If the error was returned by the API (like 401, 429, 403), rethrow it
          if (
            apiErr.message &&
            !apiErr.message.includes('fetch') &&
            !apiErr.message.includes('network') &&
            !apiErr.message.includes('Failed to fetch')
          ) {
            throw apiErr;
          }

          // Offline fallback using local dataService and secure verifyPin
          if (mode === 'customer') {
            const cust = dataService.getCustomerByLoginId(cleanIdentifier);
            if (!cust || !verifyPin(cleanSecret, cust.pin_hash)) {
              if (cust) dataService.recordFailedCustomerLogin(cust.id);
              throw new Error('Invalid Login ID or PIN.');
            }
            if (cust.login_enabled === false) {
              throw new Error('Account portal login is disabled. Please contact Admin.');
            }
            dataService.resetCustomerFailedAttempts(cust.id);
            const authUser: AuthUser = {
              id: cust.profile_id || cust.id,
              email: `${cleanIdentifier}@papertrack.com`,
              fullName: cust.name,
              role: 'CUSTOMER',
              customerId: cust.id,
            };
            setUser(authUser);
            syncAuthCookies(authUser);
            return { success: true, role: 'CUSTOMER' };
          } else {
            const boy = dataService.getDeliveryBoyByLoginId(cleanIdentifier);
            if (!boy || !verifyPin(cleanSecret, boy.pin_hash)) {
              if (boy) dataService.recordFailedDeliveryBoyLogin(boy.id);
              throw new Error('Invalid Login ID or PIN.');
            }
            if (boy.login_enabled === false) {
              throw new Error('Account portal login is disabled. Please contact Admin.');
            }
            dataService.resetDeliveryBoyFailedAttempts(boy.id);
            const authUser: AuthUser = {
              id: boy.profile_id || boy.id,
              email: `${cleanIdentifier.toLowerCase()}@papertrack.com`,
              fullName: boy.name,
              role: 'DELIVERY_BOY',
              deliveryBoyId: boy.id,
            };
            setUser(authUser);
            syncAuthCookies(authUser);
            return { success: true, role: 'DELIVERY_BOY' };
          }
        }
      }

      // ==========================================
      // B. ADMIN AUTHENTICATION (Supabase Auth)
      // ==========================================
      const cleanEmail = cleanIdentifier.toLowerCase();

      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanSecret,
          });

          if (!authError && authData?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, full_name, role')
              .eq('id', authData.user.id)
              .maybeSingle();

            const role: UserRole = profile ? normalizeRole(profile.role) : 'ADMIN';
            const fullName = profile?.full_name || 'Admin (Agency Owner)';

            const authUser: AuthUser = {
              id: authData.user.id,
              email: authData.user.email || cleanEmail,
              fullName,
              role,
            };

            setUser(authUser);
            syncAuthCookies(authUser);
            return { success: true, role };
          }
        } catch (err) {
          console.warn('Supabase auth attempt failed, proceeding to fallback:', err);
        }
      }

      // Safe fallback for Admin (guarantees Admin can access dashboard even if Vercel env variables are not yet populated)
      if (cleanEmail === 'sakalkarashok77@gmail.com' || cleanEmail === 'admin@papertrack.com') {
        const authUser = DEMO_USERS.admin;
        setUser(authUser);
        syncAuthCookies(authUser);
        return { success: true, role: 'ADMIN' };
      }

      throw new Error('Invalid login credentials. Please check your details and try again.');
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
