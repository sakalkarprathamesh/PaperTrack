'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Newspaper, Truck, Users, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { LanguageSwitcher } from './LanguageSwitcher';

export function DeliveryNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, switchDemoUser } = useAuth();
  const showDemoSwitcher = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ENABLE_DEMO_SWITCHER === 'true';

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand & Staff */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-red-700 flex items-center justify-center text-white">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <span className="font-black text-sm tracking-tight text-white">PAPERTRACK</span>
            <span className="block text-[10px] uppercase font-bold text-red-400">Delivery Route Staff</span>
          </div>
        </div>

        {/* View As Switcher, Language & User */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher compact />

          {showDemoSwitcher && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-800 p-1 rounded-lg text-xs">
              <span className="text-slate-400 px-1 text-[11px]">Role:</span>
              <button
                onClick={() => {
                  switchDemoUser('admin');
                  router.push('/admin/dashboard');
                }}
                className="px-2 py-0.5 rounded text-slate-300 hover:text-white text-[11px]"
              >
                Admin
              </button>
              <button className="px-2 py-0.5 rounded bg-red-700 text-white font-bold text-[11px]">
                Delivery Staff
              </button>
              <button
                onClick={() => {
                  switchDemoUser('customer');
                  router.push('/customer/dashboard');
                }}
                className="px-2 py-0.5 rounded text-slate-300 hover:text-white text-[11px]"
              >
                Customer
              </button>
            </div>
          )}

          <button
            onClick={logout}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <nav className="max-w-4xl mx-auto px-4 flex gap-6 text-xs font-semibold border-t border-slate-800">
        <Link
          href="/delivery/today"
          className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors ${
            pathname === '/delivery/today'
              ? 'border-red-600 text-red-500 font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Today's Checklist</span>
        </Link>
        <Link
          href="/delivery/dashboard"
          className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors ${
            pathname === '/delivery/dashboard'
              ? 'border-red-600 text-red-500 font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Overview</span>
        </Link>
        <Link
          href="/delivery/customers"
          className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors ${
            pathname === '/delivery/customers'
              ? 'border-red-600 text-red-500 font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Route Customers</span>
        </Link>
      </nav>
    </header>
  );
}
