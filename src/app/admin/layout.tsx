'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { useAuth } from '@/lib/auth-context';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'ADMIN') {
        router.push('/unauthorized');
      }
    }
  }, [user, isLoading, router]);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        Loading PaperTrack...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <AdminSidebar className="hidden lg:flex" />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
