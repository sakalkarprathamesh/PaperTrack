'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DeliveryNav } from '@/components/layout/DeliveryNav';
import { useAuth } from '@/lib/auth-context';

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading Route...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DeliveryNav />
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">{children}</main>
    </div>
  );
}
