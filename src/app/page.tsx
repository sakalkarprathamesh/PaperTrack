'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Newspaper,
  Phone,
  ShieldCheck,
  Receipt,
  Calendar,
  CreditCard,
  ArrowRight,
  User,
  Shield,
  Truck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PublicHeader } from '@/components/layout/PublicHeader';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (user.role === 'DELIVERY_BOY') {
        router.push('/delivery/today');
      } else if (user.role === 'CUSTOMER') {
        router.push('/customer/dashboard');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-xs">
        Loading PaperTrack...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicHeader />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12 flex flex-col justify-center">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold border border-red-200">
            <Newspaper className="w-3.5 h-3.5" />
            <span>Lokmat Newspaper Sangli Agency</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 font-serif leading-tight">
            Daily Newspaper Distribution & Monthly Billing Desk
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Welcome to the official subscriber & agency management portal. Check your delivered copies, monthly statements, and payment receipts online.
          </p>

          {/* Call to Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/customer-login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-sm shadow-md transition-all hover:shadow-lg"
            >
              <User className="w-4 h-4" />
              <span>Customer Login (10-Digit Mobile)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-300 shadow-xs transition-colors"
            >
              <Shield className="w-4 h-4 text-slate-400" />
              <span>Agency Staff / Admin Login</span>
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Transparent Monthly Bills</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every month, view the exact breakdown of delivered Lokmat copies, monthly subscription charges, and previous balances.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Instant Payment Receipts</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              View confirmed receipts for all cash and UPI payments credited by your delivery staff or agency owner.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Vacation Pause Requests</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Going away on holiday? Contact Admin to pause delivery during vacation days so you are only charged for papers delivered.
            </p>
          </div>
        </div>

        {/* Agency Footer Card */}
        <div className="mt-12 bg-slate-900 text-white p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-700 text-white flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Need help or your login password?</h4>
              <p className="text-xs text-slate-400">
                Contact Admin (Agency Owner) at +91 9822000001
              </p>
            </div>
          </div>

          <Link
            href="/customer-login"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold shrink-0 transition-colors"
          >
            <span>Sign In to Your Account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
