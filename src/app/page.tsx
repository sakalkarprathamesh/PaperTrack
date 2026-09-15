'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (user.role === 'DELIVERY_BOY') {
        router.push('/delivery/today');
      } else if (user.role === 'CUSTOMER') {
        router.push('/customer/dashboard');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
      Loading PaperTrack...
    </div>
  );
}
