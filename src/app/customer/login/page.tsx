'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { validatePin, validateCustomerMobileNumber } from '@/lib/security';
import { PublicHeader } from '@/components/layout/PublicHeader';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

export default function CustomerLoginPage() {
  const router = useRouter();
  const { user, login, isLoading: isAuthLoading } = useAuth();

  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rate limiting / lockout countdown
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (!isAuthLoading && user) {
      if (user.role === 'CUSTOMER') {
        router.push('/customer/dashboard');
      } else if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (user.role === 'DELIVERY_BOY') {
        router.push('/delivery/today');
      }
    }
  }, [user, isAuthLoading, router]);

  // Lockout countdown timer
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;
    setError('');

    const cleanMobile = mobileNumber.trim().replace(/\D/g, '');
    const cleanPassword = password.trim();

    // 1. Validate Mobile Number: Exactly 10 digits
    const mobileCheck = validateCustomerMobileNumber(cleanMobile);
    if (!mobileCheck.valid) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }

    // 2. Validate Password: Exactly 4 digits
    const passCheck = validatePin(cleanPassword);
    if (!passCheck.valid) {
      setError('Password must contain exactly 4 digits.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(mobileCheck.normalized!, cleanPassword, 'customer');
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
        setError(err.message || 'Invalid mobile number or password.');
      }
      setIsSubmitting(false);
    }
  };

  const isLocked = lockoutTimer > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicHeader />

      <main className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Form Card */}
          <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200">
            {/* Header */}
            <div className="mb-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-50 text-red-700 border border-red-200 mb-3">
                <Phone className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Customer Login
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Lokmat Newspaper Daily Subscriber Portal
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span className="font-medium leading-relaxed">{error}</span>
              </div>
            )}

            {/* Lockout countdown banner */}
            {isLocked && (
              <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs text-amber-800">
                <Clock className="w-4 h-4 shrink-0 animate-spin text-amber-600" />
                <span className="font-semibold">
                  Locked for {lockoutTimer}s due to multiple incorrect attempts
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field 1: 10-Digit Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  10-Digit Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <span className="text-xs font-semibold text-slate-400">+91</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    required
                    disabled={isLocked || isSubmitting}
                    placeholder="Enter your registered mobile number"
                    value={mobileNumber}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setMobileNumber(digits);
                    }}
                    className="w-full pl-12 pr-3 py-2.5 bg-slate-50 focus:bg-white text-sm font-mono rounded-xl border border-slate-300 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 transition-colors disabled:opacity-50"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Example: 9822111001 (10 digits, numbers only)
                </p>
              </div>

              {/* Field 2: 4-Digit Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  4-Digit Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    required
                    disabled={isLocked || isSubmitting}
                    placeholder="Enter your 4-digit password"
                    value={password}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setPassword(digits);
                    }}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 focus:bg-white text-sm font-mono tracking-widest rounded-xl border border-slate-300 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 transition-colors disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Exactly 4 numeric digits. Masked by default.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLocked || isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Login as Customer</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Additional Text */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Use the mobile number and 4-digit password provided by the Admin.
              </p>
            </div>

            {/* Admin link */}
            <div className="mt-4 text-center">
              <Link
                href="/login"
                className="text-[11px] text-slate-400 hover:text-slate-700 transition-colors"
              >
                Are you Agency Staff or Admin? Sign in here →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
