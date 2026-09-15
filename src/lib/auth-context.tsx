'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from './types';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  customerId?: string;
  deliveryBoyId?: string;
}

// Preset demo accounts for quick testing of all three roles
export const DEMO_USERS: Record<string, AuthUser> = {
  admin: {
    id: 'a0000000-0000-0000-0000-000000000001',
    email: 'admin@papertrack.com',
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
  login: (email: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  switchDemoUser: (key: 'admin' | 'delivery' | 'customer') => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check saved session in localStorage/cookie for prototype persistence
    const saved = localStorage.getItem('papertrack_session');
    let currentUser: AuthUser = DEMO_USERS.admin;
    if (saved) {
      try {
        currentUser = JSON.parse(saved);
      } catch {
        currentUser = DEMO_USERS.admin;
      }
    }
    setUser(currentUser);
    syncAuthCookies(currentUser);
    setIsLoading(false);
  }, []);

  const login = async (email: string, requestedRole?: UserRole): Promise<boolean> => {
    // Find matching demo or create session
    let matched = Object.values(DEMO_USERS).find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!matched) {
      const role = requestedRole || (email.includes('delivery') ? 'DELIVERY_BOY' : email.includes('customer') ? 'CUSTOMER' : 'ADMIN');
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
    return true;
  };

  const switchDemoUser = (key: 'admin' | 'delivery' | 'customer') => {
    const selected = DEMO_USERS[key];
    setUser(selected);
    syncAuthCookies(selected);
    localStorage.setItem('papertrack_session', JSON.stringify(selected));
  };

  const logout = () => {
    setUser(null);
    syncAuthCookies(null);
    localStorage.removeItem('papertrack_session');
  };


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
