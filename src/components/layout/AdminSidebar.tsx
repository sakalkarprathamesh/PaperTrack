'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Truck,
  Receipt,
  CreditCard,
  BarChart3,
  Settings,
  Newspaper,
  UserCheck,
  LogOut,
  UploadCloud,
  MessageSquare,
  IndianRupee,
  Activity,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';

export function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const navItems = [
    { key: 'nav.dashboard', defaultLabel: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { key: 'nav.customers', defaultLabel: 'Customers', href: '/admin/customers', icon: Users },
    { key: 'nav.delivery', defaultLabel: 'Daily Delivery', href: '/admin/delivery', icon: Truck },
    { key: 'nav.billing', defaultLabel: 'Monthly Billing', href: '/admin/billing', icon: Receipt },
    { key: 'nav.payments', defaultLabel: 'Payments', href: '/admin/payments', icon: CreditCard },
    { key: 'nav.collections', defaultLabel: 'Daily Collections', href: '/admin/collections', icon: IndianRupee },
    { key: 'nav.reminders', defaultLabel: 'WhatsApp Reminders', href: '/admin/reminders', icon: MessageSquare },
    { key: 'nav.deliveryStaff', defaultLabel: 'Delivery Staff', href: '/admin/delivery-boys', icon: UserCheck },
    { key: 'nav.exports', defaultLabel: 'Data Exports', href: '/admin/exports', icon: Download },
    { key: 'nav.activity', defaultLabel: 'Activity Timeline', href: '/admin/activity', icon: Activity },
    { key: 'nav.import', defaultLabel: 'Diary CSV Import', href: '/admin/import', icon: UploadCloud },
    { key: 'nav.reports', defaultLabel: 'Reports & Ledger', href: '/admin/reports', icon: BarChart3 },
    { key: 'nav.settings', defaultLabel: 'Agency Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 border-r border-slate-800 select-none min-h-screen',
        className
      )}
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-red-700 flex items-center justify-center text-white shrink-0 shadow-sm">
          <Newspaper className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-lg tracking-tight text-white">{t('brand.name')}</span>
          </div>
          <p className="text-[10px] uppercase font-semibold text-red-400 tracking-wider">
            {t('brand.subtitle')}
          </p>
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const label = t(item.key) || item.defaultLabel;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-red-700 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-slate-400')} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{user?.fullName || 'Admin'}</p>
            <p className="text-[11px] text-slate-400 truncate">Agency Administrator</p>
          </div>
          <button
            onClick={logout}
            title={t('nav.logout')}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
