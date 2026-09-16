'use client';

import React, { useState } from 'react';
import {
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { Customer } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { validatePin } from '@/lib/security';
import { CustomerLoginModal } from './CustomerLoginModal';

interface CustomerCredentialsCardProps {
  customer: Customer;
  onCustomerUpdated: (updated: Partial<Customer>) => void;
}

export function CustomerCredentialsCard({
  customer,
  onCustomerUpdated,
}: CustomerCredentialsCardProps) {
  const loginId = customer.login_id || customer.phone.replace(/\D/g, '').slice(-10);
  const isLoginActive = customer.login_enabled !== false && customer.status !== 'CANCELLED';

  // Demo default seed password is '1234' for seed customers
  const defaultKnownPin = customer.pin_hash && customer.id.startsWith('10000000') ? '1234' : null;
  const [activePassword, setActivePassword] = useState<string | null>(defaultKnownPin);
  const [isPasswordRevealed, setIsPasswordRevealed] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Status toggle state
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Reset Modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetNewPin, setResetNewPin] = useState('');
  const [resetConfirmPin, setResetConfirmPin] = useState('');
  const [showResetPins, setShowResetPins] = useState(false);
  const [resetStep, setResetStep] = useState<'INPUT' | 'CONFIRM' | 'SUCCESS'>('INPUT');
  const [resetError, setResetError] = useState('');
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  // Customer Login Preview Modal
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2500);
    } catch (e) {
      // Fallback
    }
  };

  const handleCopyPassword = () => {
    if (activePassword) {
      copyToClipboard(activePassword, 'password');
      showToast('Password copied to clipboard');
    } else {
      alert(
        'The current password is cryptographically protected with scrypt hashing. Click "Reset 4-Digit Password" to set and copy a new password.'
      );
    }
  };

  const handleToggleShowPassword = () => {
    if (!activePassword && !isPasswordRevealed) {
      alert(
        'The current password is cryptographically protected with scrypt hashing. Click "Reset 4-Digit Password" to assign a new 4-digit code.'
      );
      return;
    }
    setIsPasswordRevealed(!isPasswordRevealed);
  };

  const handleToggleLoginStatus = async () => {
    const nextStatus = !isLoginActive;
    const confirmMsg = nextStatus
      ? `Enable customer login access for ${customer.name}?`
      : `Disable customer login access for ${customer.name}? The subscriber will not be able to log in.`;

    if (!confirm(confirmMsg)) return;

    setIsTogglingStatus(true);
    setStatusError(null);
    try {
      const res = await fetch('/api/admin/customer-credentials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          loginEnabled: nextStatus,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update login status.');
      }

      onCustomerUpdated({
        login_enabled: nextStatus,
        failed_login_attempts: nextStatus ? 0 : customer.failed_login_attempts,
        locked_until: nextStatus ? null : customer.locked_until,
      });

      showToast(`Customer login successfully ${nextStatus ? 'enabled' : 'disabled'}.`);
    } catch (err: any) {
      setStatusError(err.message || 'Unable to update login status.');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Auto Generate 4-digit PIN
  const handleAutoGenerate = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setResetNewPin(randomPin);
    setResetConfirmPin(randomPin);
    setResetError('');
  };

  // Open Reset Dialog
  const handleOpenReset = () => {
    setResetNewPin('');
    setResetConfirmPin('');
    setResetError('');
    setResetStep('INPUT');
    setIsResetModalOpen(true);
  };

  // Proceed from input to confirmation
  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    const pin1Check = validatePin(resetNewPin);
    if (!pin1Check.valid) {
      setResetError('Password must contain exactly 4 digits.');
      return;
    }

    if (resetNewPin !== resetConfirmPin) {
      setResetError('Passwords do not match. Please re-enter.');
      return;
    }

    setResetStep('CONFIRM');
  };

  // Execute Password Reset
  const handleExecuteReset = async () => {
    setIsSubmittingReset(true);
    setResetError('');

    try {
      const res = await fetch('/api/admin/customer-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          newPin: resetNewPin,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset customer password in database.');
      }

      const nowIso = data.pin_updated_at || new Date().toISOString();

      // Update parent customer data
      onCustomerUpdated({
        pin_updated_at: nowIso,
        failed_login_attempts: 0,
        locked_until: null,
      });

      // Keep newly assigned password in active state so Admin can view and copy
      setActivePassword(resetNewPin);
      setIsPasswordRevealed(true);
      setResetStep('SUCCESS');
      showToast(`Password successfully reset to ${resetNewPin}.`);
    } catch (err: any) {
      setResetError(err.message || 'Unable to reset password. Please try again.');
      setResetStep('INPUT');
    } finally {
      setIsSubmittingReset(false);
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Toast Notification */}
      {feedbackMessage && (
        <div className="bg-emerald-700 text-white text-xs font-semibold px-4 py-2 text-center flex items-center justify-center gap-1.5 animate-in fade-in duration-150">
          <Check className="w-4 h-4" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Card Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center border border-red-200 shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Customer Login Credentials
              </h2>
              {isLoginActive ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Active</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <ShieldAlert className="w-3 h-3 text-rose-600" />
                  <span>Disabled</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage 10-digit mobile login ID, 4-digit password, and portal permissions
            </p>
          </div>
        </div>

        {/* Customer Login Button (Opens Modal Preview) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLoginModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Customer Login</span>
          </button>
        </div>
      </div>

      {statusError && (
        <div className="m-6 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{statusError}</span>
        </div>
      )}

      {/* Grid of Credentials */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Identifiers */}
        <div className="space-y-4">
          {/* Customer Name */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Customer Name
            </span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">
              {customer.name}
            </span>
          </div>

          {/* Customer Mobile Number */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Customer Mobile Number
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="font-mono text-xs font-semibold text-slate-800">
                {customer.phone}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(customer.phone, 'phone')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-600 transition-colors"
              >
                {copiedField === 'phone' ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3 text-slate-400" />
                )}
                <span>{copiedField === 'phone' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Customer Login ID (10-Digit Mobile) */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Customer Login ID (10-Digit Mobile)
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="font-mono font-bold text-sm text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200">
                {loginId}
              </span>
              <button
                type="button"
                onClick={() => {
                  copyToClipboard(loginId, 'loginId');
                  showToast('Login ID copied to clipboard');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
              >
                {copiedField === 'loginId' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Login ID</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Customers use this exact 10-digit number to log in at /customer/login.
            </p>
          </div>
        </div>

        {/* Right Column: Password & Status Controls */}
        <div className="space-y-4">
          {/* 4-Digit Password Field */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Customer 4-Digit Password
              </span>
              <span className="text-[10px] text-slate-400">
                scrypt cryptographic hash
              </span>
            </div>

            <div className="flex items-center justify-between mt-1.5 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-base text-slate-900 bg-white px-3 py-1 rounded border border-slate-200 tracking-widest min-w-[70px] text-center">
                  {isPasswordRevealed && activePassword ? activePassword : '••••'}
                </span>
                <button
                  type="button"
                  onClick={handleToggleShowPassword}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                  title={isPasswordRevealed ? 'Hide Password' : 'Show Password'}
                  aria-label={isPasswordRevealed ? 'Hide Password' : 'Show Password'}
                >
                  {isPasswordRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
                >
                  {copiedField === 'password' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Password</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleOpenReset}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-bold text-red-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Password</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-2">
              Masked by default. Passwords are never saved as plaintext in database.
            </p>
          </div>

          {/* Access Control: Status Toggle & Last Updated */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Credential Status
                </span>
                <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                  {isLoginActive ? 'Login Enabled (Active)' : 'Login Disabled (Inactive)'}
                </span>
              </div>

              <button
                type="button"
                disabled={isTogglingStatus}
                onClick={handleToggleLoginStatus}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                  isLoginActive
                    ? 'bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700'
                    : 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700'
                }`}
              >
                {isTogglingStatus ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isLoginActive ? (
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>
                  {isTogglingStatus
                    ? 'Updating...'
                    : isLoginActive
                    ? 'Disable Customer Login'
                    : 'Enable Customer Login'}
                </span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Last Updated:</span>
              </span>
              <span className="font-medium text-slate-700">
                {customer.pin_updated_at ? formatDate(customer.pin_updated_at) : 'Not updated recently'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Login Modal Preview */}
      <CustomerLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        customer={customer}
        onEnableLogin={!isLoginActive ? handleToggleLoginStatus : undefined}
      />

      {/* Admin 4-Digit Password Reset Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Reset 4-Digit Customer Password
                  </h3>
                  <p className="text-[11px] text-slate-500">For {customer.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: STEP 1 - Input */}
            {resetStep === 'INPUT' && (
              <form onSubmit={handleProceedToConfirm} className="p-6 space-y-4 text-xs">
                {resetError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-semibold">
                    Set a new 4-digit numeric password
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoGenerate}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 hover:text-red-800"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto Generate</span>
                  </button>
                </div>

                {/* New Password */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    New 4-Digit Password:
                  </label>
                  <div className="relative">
                    <input
                      type={showResetPins ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      required
                      placeholder="e.g. 4821"
                      value={resetNewPin}
                      onChange={(e) => setResetNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-xl font-mono text-sm tracking-widest focus:border-red-700 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPins(!showResetPins)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showResetPins ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Confirm 4-Digit Password:
                  </label>
                  <div className="relative">
                    <input
                      type={showResetPins ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      required
                      placeholder="Re-enter 4 digits"
                      value={resetConfirmPin}
                      onChange={(e) => setResetConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-xl font-mono text-sm tracking-widest focus:border-red-700 focus:outline-none"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Password must be confirmed twice before saving.
                </p>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    className="px-3.5 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl shadow-xs"
                  >
                    Proceed to Confirm
                  </button>
                </div>
              </form>
            )}

            {/* Modal Body: STEP 2 - Confirmation */}
            {resetStep === 'CONFIRM' && (
              <div className="p-6 space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-3 text-amber-900">
                  <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-sm">Confirm Password Reset</p>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Are you sure you want to reset the password for <strong>{customer.name}</strong> to:
                    </p>
                    <div className="inline-block font-mono font-black text-base text-red-700 bg-white px-3 py-1 rounded border border-amber-300 tracking-widest my-1">
                      {resetNewPin}
                    </div>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      This will update Supabase simultaneously. Any existing active customer sessions on their device will be invalidated.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isSubmittingReset}
                    onClick={() => setResetStep('INPUT')}
                    className="px-3.5 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingReset}
                    onClick={handleExecuteReset}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
                  >
                    {isSubmittingReset ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving to Supabase...</span>
                      </>
                    ) : (
                      <span>Confirm & Save</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Modal Body: STEP 3 - Success */}
            {resetStep === 'SUCCESS' && (
              <div className="p-6 space-y-4 text-xs text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    Password Successfully Reset
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Share the new credentials with {customer.name}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-left">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Login ID:</span>
                    <span className="font-mono font-bold text-slate-900">{loginId}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-slate-200/60 pt-2">
                    <span className="text-slate-500">New Password:</span>
                    <span className="font-mono font-bold text-red-700 text-sm bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      {resetNewPin}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-slate-200/60 pt-2">
                    <span className="text-slate-500">Login URL:</span>
                    <span className="font-mono text-slate-700">/customer/login</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const msg = `Lokmat Customer Portal\nWebsite: ${window.location.origin}/customer/login\nCustomer Login ID: ${loginId}\nNew Password: ${resetNewPin}`;
                      navigator.clipboard.writeText(msg);
                      showToast('Credentials copied to clipboard');
                    }}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Credentials</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
