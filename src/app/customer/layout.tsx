'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CustomerNav } from '@/components/layout/CustomerNav';
import { useAuth } from '@/lib/auth-context';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'CUSTOMER' && user.role !== 'ADMIN') {
        router.push('/unauthorized');
      }
    }
  }, [user, isLoading, router]);


  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading your account...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <CustomerNav />
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">{children}</main>
    </div>
  );
}
