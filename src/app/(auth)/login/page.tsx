'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Newspaper, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Demo role switcher is strictly hidden in production
  const showDevDemoPanel = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ENABLE_DEMO_SWITCHER === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email.trim(), password.trim());
      if (result.success) {
        // Redirection is strictly determined by the server-verified role from profiles
        if (result.role === 'DELIVERY_BOY') {
          router.push('/delivery/today');
        } else if (result.role === 'CUSTOMER') {
          router.push('/customer/dashboard');
        } else {
          router.push('/admin/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Newspaper Header Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-700 text-white shadow-lg mb-4 ring-4 ring-red-100">
          <Newspaper className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 font-serif">
          PAPERTRACK
        </h1>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="h-px w-8 bg-red-700"></span>
          <p className="text-xs font-bold text-red-700 uppercase tracking-widest">
            Lokmat Agency Edition
          </p>
          <span className="h-px w-8 bg-red-700"></span>
        </div>
        <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
          Newspaper Distribution, Daily Route Attendance & Monthly Billing Desk
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 border border-slate-200/80 rounded-2xl sm:px-10">
          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="sakalkarashok77@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-700 focus:ring-2 focus:ring-red-700/20 transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-red-700 hover:text-red-800 font-medium hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-700 focus:ring-2 focus:ring-red-700/20 transition-all shadow-xs"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl shadow-md text-xs font-bold text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-700/30 transition-all disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Secure Environment Badge */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted Session • Role-Protected Portals</span>
          </div>

          {/* Local-Development-Only Testing Switcher (Strictly Hidden in Production) */}
          {showDevDemoPanel && (
            <div className="mt-6 pt-4 border-t border-amber-200/80 bg-amber-50/60 -mx-6 -mb-8 p-4 rounded-b-2xl">
              <span className="text-[10px] font-bold uppercase text-amber-700 block text-center tracking-wider mb-2">
                Local Dev Only: Quick Switcher
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                <button
                  type="button"
                  onClick={async () => {
                    await login('sakalkarashok77@gmail.com');
                    router.push('/admin/dashboard');
                  }}
                  className="px-2 py-1.5 bg-white border border-amber-300 rounded-lg text-slate-700 font-semibold text-[11px] hover:bg-amber-100"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await login('ramesh@papertrack.com');
                    router.push('/delivery/today');
                  }}
                  className="px-2 py-1.5 bg-white border border-amber-300 rounded-lg text-slate-700 font-semibold text-[11px] hover:bg-amber-100"
                >
                  Delivery
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await login('anand@papertrack.com');
                    router.push('/customer/dashboard');
                  }}
                  className="px-2 py-1.5 bg-white border border-amber-300 rounded-lg text-slate-700 font-semibold text-[11px] hover:bg-amber-100"
                >
                  Customer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-8">
          PaperTrack &copy; {new Date().getFullYear()} Lokmat Newspaper Agency. All rights reserved.
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Password Assistance</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              To reset your password, please contact the PaperTrack Agency Administrator. For security, route staff and subscriber accounts are managed directly through the agency desk.
            </p>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
