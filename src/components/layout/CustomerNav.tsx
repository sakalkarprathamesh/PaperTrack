'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Newspaper, LayoutDashboard, Receipt, CreditCard, User, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { LanguageSwitcher } from './LanguageSwitcher';

export function CustomerNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, switchDemoUser } = useAuth();
  const showDemoSwitcher = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_DEMO_SWITCHER === 'true';

  const navLinks = [
    { label: 'My Dashboard', href: '/customer/dashboard', icon: LayoutDashboard },
    { label: 'My Bills', href: '/customer/bills', icon: Receipt },
    { label: 'Payment Receipts', href: '/customer/payments', icon: CreditCard },
    { label: 'Subscription Profile', href: '/customer/profile', icon: User },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/customer/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-red-700 flex items-center justify-center text-white font-bold">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <span className="font-black text-base tracking-tight text-slate-900">PAPERTRACK</span>
            <span className="block text-[10px] uppercase font-bold text-red-700">Subscriber Portal</span>
          </div>
        </Link>

        {/* User Info, Language & Switcher */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher compact />

          {/* View As Switcher for quick evaluation (hidden in production by default) */}
          {showDemoSwitcher && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
              <span className="text-slate-400 px-1 text-[11px]">Role:</span>
              <button
                onClick={() => {
                  switchDemoUser('admin');
                  router.push('/admin/dashboard');
                }}
                className="px-2 py-0.5 rounded text-slate-600 hover:text-slate-900 text-[11px]"
              >
                Admin
              </button>
              <button
                onClick={() => {
                  switchDemoUser('delivery');
                  router.push('/delivery/today');
                }}
                className="px-2 py-0.5 rounded text-slate-600 hover:text-slate-900 text-[11px]"
              >
                Delivery Staff
              </button>
              <button className="px-2 py-0.5 rounded bg-red-700 text-white font-bold text-[11px]">
                Customer
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 text-xs">
            <span className="font-bold text-slate-800 hidden md:inline">{user?.fullName || 'Subscriber'}</span>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <nav className="max-w-4xl mx-auto px-4 flex gap-6 text-xs font-semibold border-t border-slate-100 overflow-x-auto">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`py-3 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-red-700 text-red-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
