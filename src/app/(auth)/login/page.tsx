'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Newspaper, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { useAuth, DEMO_USERS } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login, switchDemoUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      return;
    }

    setIsLoading(true);
    try {
      const ok = await login(email.trim());
      if (ok) {
        if (email.includes('delivery')) {
          router.push('/delivery/today');
        } else if (email.includes('customer')) {
          router.push('/customer/dashboard');
        } else {
          router.push('/admin/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (role: 'admin' | 'delivery' | 'customer') => {
    switchDemoUser(role);
    if (role === 'admin') router.push('/admin/dashboard');
    else if (role === 'delivery') router.push('/delivery/today');
    else router.push('/customer/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Newspaper Brand Icon */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-700 text-white shadow-md mb-3">
          <Newspaper className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">PAPERTRACK</h1>
        <p className="text-xs font-bold text-red-700 uppercase tracking-widest mt-0.5">
          Newspaper Distribution & Billing Management
        </p>
        <p className="text-xs text-slate-500 mt-2">
          Designed for Lokmat Newspaper Agency Operations
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 sm:rounded-2xl sm:px-10 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@papertrack.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg shadow-xs text-xs font-bold text-white bg-red-700 hover:bg-red-800 transition-colors disabled:opacity-50"
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 1-Click Evaluation / Demo Login Switcher */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <span className="text-[11px] font-bold uppercase text-slate-400 block text-center">
              Quick 1-Click Role Login for Testing
            </span>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left text-xs group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                    A
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Admin (Agency Owner)</span>
                    <span className="text-[10px] text-slate-500">Full agency billing, customers & payments</span>
                  </div>
                </div>
                <span className="text-red-700 font-semibold text-xs group-hover:translate-x-0.5 transition-transform">
                  Login →
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('delivery')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left text-xs group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                    R
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Ramesh Shinde (Delivery Staff)</span>
                    <span className="text-[10px] text-slate-500">Route checklist, zero financial access</span>
                  </div>
                </div>
                <span className="text-slate-700 font-semibold text-xs group-hover:translate-x-0.5 transition-transform">
                  Login →
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('customer')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left text-xs group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    A
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Anand Kulkarni (Subscriber)</span>
                    <span className="text-[10px] text-slate-500">View own bill, receipts & balance</span>
                  </div>
                </div>
                <span className="text-emerald-700 font-semibold text-xs group-hover:translate-x-0.5 transition-transform">
                  Login →
                </span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          PaperTrack &copy; {new Date().getFullYear()} Lokmat Newspaper Distribution Agency.
        </p>
      </div>
    </div>
  );
}
