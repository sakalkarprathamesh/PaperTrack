'use client';

import React, { useState } from 'react';
import {
  Key,
  ExternalLink,
  Copy,
  Check,
  X,
  AlertTriangle,
  Loader2,
  AlertCircle,
  Phone,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { Customer } from '@/lib/types';

interface CustomerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  isLoading?: boolean;
  error?: string | null;
  onEnableLogin?: () => Promise<void>;
}

export function CustomerLoginModal({
  isOpen,
  onClose,
  customer,
  isLoading = false,
  error = null,
  onEnableLogin,
}: CustomerLoginModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isEnabling, setIsEnabling] = useState(false);

  if (!isOpen) return null;

  const loginId = customer
    ? customer.login_id || customer.phone.replace(/\D/g, '').slice(-10)
    : '';

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const customerLoginUrl = `${origin}/customer/login`;
  const relativeLoginUrl = '/customer/login';

  const isLoginDisabled = customer?.login_enabled === false || customer?.status === 'CANCELLED';

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2500);
    } catch (e) {
      // Fallback
    }
  };

  const handleCopyAll = () => {
    const message = `Lokmat Customer Portal\nWebsite: ${customerLoginUrl}\nCustomer Login ID: ${loginId}\nPassword: Use your 4-digit password\n\nLog in to view daily newspaper delivery status, monthly bills, and payment receipts.`;
    copyToClipboard(message, 'all');
  };

  const handleOpenLogin = () => {
    window.open(relativeLoginUrl, '_blank', 'noopener,noreferrer');
  };

  const handleEnable = async () => {
    if (!onEnableLogin) return;
    setIsEnabling(true);
    try {
      await onEnableLogin();
    } finally {
      setIsEnabling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center border border-red-200">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Customer Portal Login
              </h3>
              <p className="text-xs text-slate-500">
                Direct access & credential details for subscriber
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Loading State */}
          {isLoading && (
            <div className="py-8 flex flex-col items-center justify-center text-slate-600 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-red-700" />
              <span className="text-xs font-semibold">Opening customer login…</span>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-bold">{error}</p>
                <p className="text-[11px] text-red-600 mt-0.5">Please try again.</p>
              </div>
            </div>
          )}

          {/* Account Not Found */}
          {!isLoading && !error && !customer && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-bold">Customer account not found</p>
                <p className="text-[11px] text-red-600 mt-0.5">
                  Unable to load credentials for this subscriber. Please try again.
                </p>
              </div>
            </div>
          )}

          {/* Customer Credentials Preview */}
          {!isLoading && customer && (
            <>
              {/* Disabled Banner */}
              {isLoginDisabled && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 flex items-start justify-between gap-3 text-xs text-amber-800">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Customer login is disabled</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        This customer cannot sign in until their login access is enabled.
                      </p>
                    </div>
                  </div>
                  {onEnableLogin && (
                    <button
                      type="button"
                      disabled={isEnabling}
                      onClick={handleEnable}
                      className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-[11px] shrink-0 transition-colors disabled:opacity-50"
                    >
                      {isEnabling ? 'Enabling...' : 'Enable Login'}
                    </button>
                  )}
                </div>
              )}

              {/* Subscriber Details Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                {/* Name & Status */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Subscriber Name
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {customer.name}
                    </span>
                  </div>
                  <div>
                    {!isLoginDisabled ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        <span>Disabled</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Login ID (10-Digit Mobile) */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Customer Login ID (10-Digit Mobile)
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono font-bold text-sm text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200">
                        {loginId}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        (+91 format)
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(loginId, 'loginId')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition-colors"
                  >
                    {copiedField === 'loginId' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Customer Login URL */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Customer Login URL
                    </span>
                    <span className="font-mono text-xs text-red-700 truncate block mt-0.5 font-semibold">
                      {relativeLoginUrl}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(customerLoginUrl, 'url')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition-colors shrink-0"
                  >
                    {copiedField === 'url' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Security Guidance Note */}
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Opening the customer portal will not automatically sign you in as this subscriber.
                Customers must authenticate using their registered 10-digit mobile number and their private 4-digit password.
              </p>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!isLoading && customer && (
          <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={handleCopyAll}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
            >
              {copiedField === 'all' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Details Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copy Login Details</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleOpenLogin}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <span>Open /customer/login</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
