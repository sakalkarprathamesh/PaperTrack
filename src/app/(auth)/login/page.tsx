'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Newspaper,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

type LoginMode = 'admin' | 'customer';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

export default function LoginPage() {
  const router = useRouter();
  const { login, isConfigured } = useAuth();

  const [mode, setMode] = useState<LoginMode>('admin');

  // Admin form state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Customer form state
  const [customerLoginId, setCustomerLoginId] = useState('');
  const [customerPassword, setCustomerPassword] = useState('');
  const [showCustomerPassword, setShowCustomerPassword] = useState(false);

  // Shared UI state
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Client-side rate limiting / lockout state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;
    setError('');

    const cleanEmail = adminEmail.trim();
    const cleanPass = adminPassword.trim();

    if (!cleanEmail || !cleanPass) {
      setError('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(cleanEmail, cleanPass, 'admin');
      if (result.success) {
        setFailedAttempts(0);
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      const newFails = failedAttempts + 1;
      setFailedAttempts(newFails);

      if (newFails >= MAX_FAILED_ATTEMPTS) {
        setLockoutTimer(LOCKOUT_SECONDS);
        setError(`Too many failed login attempts. For security, please wait ${LOCKOUT_SECONDS} seconds before trying again.`);
      } else {
        setError(err.message || 'Invalid login credentials. Please check your details and try again.');
      }
      setIsLoading(false);
    }
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;
    setError('');

    const cleanId = customerLoginId.trim();
    const cleanPass = customerPassword.trim();

    if (!cleanId || !cleanPass) {
      setError('Please enter both your Login ID and password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(cleanId, cleanPass, 'customer');
      if (result.success) {
        setFailedAttempts(0);
        router.push('/customer/dashboard');
      }
    } catch (err: any) {
      const newFails = failedAttempts + 1;
      setFailedAttempts(newFails);

      if (newFails >= MAX_FAILED_ATTEMPTS) {
        setLockoutTimer(LOCKOUT_SECONDS);
        setError(`Too many failed login attempts. For security, please wait ${LOCKOUT_SECONDS} seconds before trying again.`);
      } else {
        setError(err.message || 'Invalid login credentials. Please check your details and try again.');
      }
      setIsLoading(false);
    }
  };

  const isLocked = lockoutTimer > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Newspaper Header Masthead */}
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

      {/* Main Authentication Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 border border-slate-200/80 rounded-2xl sm:px-10">
          {/* Dual Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setMode('admin');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'admin'
                  ? 'bg-white text-red-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('customer');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'customer'
                  ? 'bg-white text-red-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Customer Login
            </button>
          </div>

          {/* Mode Subtitle Description */}
          <div className="mb-5 text-left">
            <h2 className="text-sm font-bold text-slate-900">
              {mode === 'admin' ? 'Agency Admin Sign In' : 'Subscriber Sign In'}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {mode === 'admin'
                ? 'Sign in to access route operations, subscriber billing, and ledgers.'
                : 'Sign in with your assigned Login ID to view daily bills and receipts.'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-xs animate-in fade-in-50">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          {/* Rate-Limit Cooldown Banner */}
          {isLocked && (
            <div className="mb-5 p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-2.5 text-amber-800 text-xs">
              <Clock className="w-4 h-4 shrink-0 animate-spin" />
              <span className="font-semibold">
                Cooldown active: retry in {lockoutTimer}s
              </span>
            </div>
          )}

          {/* ======================================================== */}
          {/* ADMIN LOGIN FORM                                         */}
          {/* ======================================================== */}
          {mode === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
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
                    disabled={isLocked}
                    placeholder="sakalkarashok77@gmail.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-700 focus:ring-2 focus:ring-red-700/20 transition-all shadow-xs disabled:bg-slate-50 disabled:text-slate-400"
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
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    disabled={isLocked}
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-700 focus:ring-2 focus:ring-red-700/20 transition-all shadow-xs disabled:bg-slate-50 disabled:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || isLocked}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl shadow-md text-xs font-bold text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-700/30 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : isLocked ? (
                    <span>Wait {lockoutTimer}s...</span>
                  ) : (
                    <>
                      <span>Sign In as Admin</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* CUSTOMER LOGIN FORM                                      */}
          {/* ======================================================== */}
          {mode === 'customer' && (
            <form onSubmit={handleCustomerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Customer Login ID
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    autoComplete="username"
                    disabled={isLocked}
                    placeholder="e.g. 919822111001"
                    value={customerLoginId}
                    onChange={(e) => setCustomerLoginId(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-700 focus:ring-2 focus:ring-red-700/20 transition-all shadow-xs disabled:bg-slate-50 disabled:text-slate-400 font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Enter your numeric subscriber ID or mobile number provided by the agency.
                </p>
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
                    type={showCustomerPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    disabled={isLocked}
                    placeholder="••••••••"
                    value={customerPassword}
                    onChange={(e) => setCustomerPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-700 focus:ring-2 focus:ring-red-700/20 transition-all shadow-xs disabled:bg-slate-50 disabled:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomerPassword(!showCustomerPassword)}
                    aria-label={showCustomerPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                  >
                    {showCustomerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || isLocked}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl shadow-md text-xs font-bold text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-700/30 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : isLocked ? (
                    <span>Wait {lockoutTimer}s...</span>
                  ) : (
                    <>
                      <span>Sign In as Subscriber</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Secure Environment Badge */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Supabase Encrypted Session • Role Isolation</span>
          </div>
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
              {mode === 'admin'
                ? 'To reset your Admin credentials, use your Supabase project dashboard or contact system support.'
                : 'Please contact the PaperTrack Agency Administrator. Subscriber account credentials and one-time passwords are managed securely from the agency desk.'}
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
