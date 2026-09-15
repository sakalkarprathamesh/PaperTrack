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
  Truck,
  KeyRound,
  HelpCircle,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { validatePin, validateCustomerLoginId, validateDeliveryBoyId } from '@/lib/security';

type LoginMode = 'admin' | 'customer' | 'delivery_boy';

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
  const [customerPin, setCustomerPin] = useState('');
  const [showCustomerPin, setShowCustomerPin] = useState(false);

  // Delivery Staff form state
  const [deliveryBoyId, setDeliveryBoyId] = useState('');
  const [deliveryBoyPin, setDeliveryBoyPin] = useState('');
  const [showDeliveryBoyPin, setShowDeliveryBoyPin] = useState(false);

  // Shared UI state
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Rate limiting / lockout countdown
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

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
    const cleanPin = customerPin.trim();

    const idCheck = validateCustomerLoginId(cleanId);
    if (!idCheck.valid) {
      setError(idCheck.error || 'Customer Login ID must contain numeric digits only.');
      return;
    }

    const pinCheck = validatePin(cleanPin);
    if (!pinCheck.valid) {
      setError(pinCheck.error || 'PIN must be exactly 4 numeric digits.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(cleanId, cleanPin, 'customer');
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
        setError(err.message || 'Invalid Login ID or PIN.');
      }
      setIsLoading(false);
    }
  };

  const handleDeliveryBoySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;
    setError('');

    const rawId = deliveryBoyId.trim();
    const cleanPin = deliveryBoyPin.trim();

    const dboyCheck = validateDeliveryBoyId(rawId);
    if (!dboyCheck.valid) {
      setError(dboyCheck.error || 'Delivery Staff ID must be in format D followed by 3 digits (e.g. D001).');
      return;
    }

    const pinCheck = validatePin(cleanPin);
    if (!pinCheck.valid) {
      setError(pinCheck.error || 'PIN must be exactly 4 numeric digits.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(dboyCheck.normalized!, cleanPin, 'delivery_boy');
      if (result.success) {
        setFailedAttempts(0);
        router.push('/delivery/dashboard');
      }
    } catch (err: any) {
      const newFails = failedAttempts + 1;
      setFailedAttempts(newFails);

      if (newFails >= MAX_FAILED_ATTEMPTS) {
        setLockoutTimer(LOCKOUT_SECONDS);
        setError(`Too many failed login attempts. For security, please wait ${LOCKOUT_SECONDS} seconds before trying again.`);
      } else {
        setError(err.message || 'Invalid Login ID or PIN.');
      }
      setIsLoading(false);
    }
  };

  const isLocked = lockoutTimer > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
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
        <p className="text-xs text-slate-500 mt-2">
          Newspaper Distribution & Daily Accounts Desk
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200">
          {/* 3-Mode Tab Navigation */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('admin');
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all text-center ${
                mode === 'admin'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('customer');
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all text-center ${
                mode === 'customer'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('delivery_boy');
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all text-center ${
                mode === 'delivery_boy'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Delivery Staff
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Rate-limiting Lockout Banner */}
          {isLocked && (
            <div className="mb-6 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700 animate-spin shrink-0" />
              <span>
                Account locked. Try again in <strong>{lockoutTimer}s</strong>.
              </span>
            </div>
          )}

          {/* ====================================================== */}
          {/* 1. ADMIN LOGIN FORM                                   */}
          {/* ====================================================== */}
          {mode === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Admin Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    disabled={isLocked || isLoading}
                    placeholder="sakalkarashok77@gmail.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    disabled={isLocked || isLoading}
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 disabled:bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    tabIndex={-1}
                    aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLocked || isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg bg-red-700 hover:bg-red-800 active:bg-red-900 text-white text-xs font-bold tracking-wide shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Admin Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ====================================================== */}
          {/* 2. CUSTOMER LOGIN FORM                                */}
          {/* ====================================================== */}
          {mode === 'customer' && (
            <form onSubmit={handleCustomerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Customer Login ID
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    disabled={isLocked || isLoading}
                    placeholder="Enter numeric Login ID (e.g. 12345)"
                    value={customerLoginId}
                    onChange={(e) => setCustomerLoginId(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 disabled:bg-slate-50"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Numeric digits only. Provided during customer registration.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    4-Digit PIN
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(true)}
                    className="text-[11px] text-red-700 hover:underline font-semibold"
                  >
                    Forgot PIN?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showCustomerPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    required
                    disabled={isLocked || isLoading}
                    placeholder="••••"
                    value={customerPin}
                    onChange={(e) => setCustomerPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-lg border border-slate-300 font-mono tracking-widest text-center focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 disabled:bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomerPin(!showCustomerPin)}
                    tabIndex={-1}
                    aria-label={showCustomerPin ? 'Hide PIN' : 'Show PIN'}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showCustomerPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLocked || isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg bg-red-700 hover:bg-red-800 active:bg-red-900 text-white text-xs font-bold tracking-wide shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Customer Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ====================================================== */}
          {/* 3. DELIVERY BOY LOGIN FORM                             */}
          {/* ====================================================== */}
          {mode === 'delivery_boy' && (
            <form onSubmit={handleDeliveryBoySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Delivery Staff ID
                </label>
                <div className="relative">
                  <Truck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    maxLength={4}
                    disabled={isLocked || isLoading}
                    placeholder="e.g. D001"
                    value={deliveryBoyId}
                    onChange={(e) => setDeliveryBoyId(e.target.value.toUpperCase())}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 font-mono uppercase focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 disabled:bg-slate-50"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Format: D followed by 3 digits (e.g. D001, D002).
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    4-Digit PIN
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(true)}
                    className="text-[11px] text-red-700 hover:underline font-semibold"
                  >
                    Forgot PIN?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showDeliveryBoyPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    required
                    disabled={isLocked || isLoading}
                    placeholder="••••"
                    value={deliveryBoyPin}
                    onChange={(e) => setDeliveryBoyPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-lg border border-slate-300 font-mono tracking-widest text-center focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 disabled:bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeliveryBoyPin(!showDeliveryBoyPin)}
                    tabIndex={-1}
                    aria-label={showDeliveryBoyPin ? 'Hide PIN' : 'Show PIN'}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showDeliveryBoyPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLocked || isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg bg-red-700 hover:bg-red-800 active:bg-red-900 text-white text-xs font-bold tracking-wide shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Delivery Route</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Security Assurance Footer */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-500 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure 256-bit encrypted authentication</span>
          </div>
        </div>
      </div>

      {/* Help / Forgot PIN Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <HelpCircle className="w-4 h-4 text-red-700" />
                <span>Portal Access Help</span>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              If you have forgotten your Login ID or 4-digit PIN, please contact your agency administrator.
              The Admin can verify your details and issue or reset your PIN immediately.
            </p>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
