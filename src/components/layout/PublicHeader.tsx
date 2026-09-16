'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Newspaper,
  User,
  LogOut,
  LayoutDashboard,
  Shield,
  Truck,
  Menu,
  X,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function PublicHeader() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/customer/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-red-700 text-white flex items-center justify-center shadow-xs group-hover:bg-red-800 transition-colors">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-slate-900 font-serif">
                PAPERTRACK
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider border border-red-200">
                Lokmat
              </span>
            </div>
            <span className="block text-[10px] font-medium text-slate-500">
              Agency Distribution & Billing
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Customer view */}
              {user.role === 'CUSTOMER' && (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <User className="w-3.5 h-3.5 text-red-700" />
                    <span className="font-semibold text-slate-800">
                      {user.fullName || 'Subscriber'}
                    </span>
                  </div>
                  <Link
                    href="/customer/dashboard"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>My Dashboard</span>
                  </Link>
                </>
              )}

              {/* Admin view */}
              {user.role === 'ADMIN' && (
                <>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                    <Shield className="w-3.5 h-3.5 text-red-700" />
                    <span>Admin</span>
                  </div>
                  <Link
                    href="/admin/dashboard"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Admin Console</span>
                  </Link>
                </>
              )}

              {/* Delivery Boy view */}
              {user.role === 'DELIVERY_BOY' && (
                <>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                    <Truck className="w-3.5 h-3.5 text-red-700" />
                    <span>Delivery Staff</span>
                  </div>
                  <Link
                    href="/delivery/today"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Today&apos;s Route</span>
                  </Link>
                </>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-red-700 hover:bg-red-50 text-xs font-medium transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors px-2 py-1"
              >
                Staff / Admin Login
              </Link>
              <Link
                href="/customer/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span>Customer Login</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          {!user && (
            <Link
              href="/customer/login"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-700 text-white text-xs font-bold"
            >
              <span>Customer Login</span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-3 shadow-lg">
          {user ? (
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <span className="block text-slate-400 text-[10px] uppercase font-bold">
                  Signed in as:
                </span>
                <span className="font-bold text-slate-900">{user.fullName}</span>
                <span className="block text-[11px] text-red-700 font-semibold mt-0.5">
                  Role: {user.role}
                </span>
              </div>

              {user.role === 'CUSTOMER' && (
                <Link
                  href="/customer/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-red-700 text-white text-xs font-bold"
                >
                  <span>Open My Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              {user.role === 'ADMIN' && (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold"
                >
                  <span>Open Admin Console</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              {user.role === 'DELIVERY_BOY' && (
                <Link
                  href="/delivery/today"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-red-700 text-white text-xs font-bold"
                >
                  <span>Open Delivery Route</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 text-xs font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <Link
                href="/customer/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-red-700 text-white text-xs font-bold shadow-xs"
              >
                <User className="w-4 h-4" />
                <span>Customer Login</span>
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                <span>Staff / Admin Login</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
