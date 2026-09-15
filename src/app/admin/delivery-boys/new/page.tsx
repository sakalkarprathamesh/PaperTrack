'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  User,
  Phone,
  MapPin,
  Truck,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { hashPin, validatePin, validateDeliveryBoyId } from '@/lib/security';

export default function NewDeliveryBoyPage() {
  const router = useRouter();

  // Suggest next available Delivery Boy ID (e.g. D003)
  const getNextDeliveryBoyId = () => {
    const boys = dataService.getDeliveryBoys();
    let maxNum = 0;
    for (const b of boys) {
      if (b.login_id && /^D\d{3}$/i.test(b.login_id)) {
        const num = parseInt(b.login_id.substring(1), 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextNum = maxNum + 1;
    return `D${nextNum.toString().padStart(3, '0')}`;
  };

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    area: '',
    is_active: true,
    login_id: '',
    pin: '',
    login_enabled: true,
  });

  useEffect(() => {
    setFormData((prev) => ({ ...prev, login_id: getNextDeliveryBoyId() }));
  }, []);

  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // One-time credential modal state
  const [createdCredentials, setCreatedCredentials] = useState<{
    staffName: string;
    loginId: string;
    pin: string;
  } | null>(null);

  const handleGeneratePin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setFormData((prev) => ({ ...prev, pin: randomPin }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Staff name is required.');
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      setError('Valid 10-digit mobile number is required.');
      return;
    }
    if (!formData.area.trim()) {
      setError('Delivery route / area is required.');
      return;
    }

    const idCheck = validateDeliveryBoyId(formData.login_id);
    if (!idCheck.valid) {
      setError(idCheck.error || 'Delivery Staff ID must be "D" followed by 3 digits (e.g. D001).');
      return;
    }

    const pinCheck = validatePin(formData.pin);
    if (!pinCheck.valid) {
      setError(pinCheck.error || 'PIN must be exactly 4 numeric digits.');
      return;
    }

    setIsSubmitting(true);
    try {
      const hashedPin = hashPin(formData.pin.trim());

      dataService.createDeliveryBoy({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        area: formData.area.trim(),
        is_active: formData.is_active,
        login_id: idCheck.normalized!,
        pin_hash: hashedPin,
        login_enabled: formData.login_enabled,
      });

      // Show credentials once in confirmation modal
      setCreatedCredentials({
        staffName: formData.name.trim(),
        loginId: idCheck.normalized!,
        pin: formData.pin.trim(),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create staff member');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/delivery-boys"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Delivery Staff</span>
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 md:p-8">
        <div className="border-b border-slate-200 pb-5 mb-6">
          <h1 className="text-xl font-bold text-slate-900">Add New Delivery Staff</h1>
          <p className="text-xs text-slate-500 mt-1">
            Register a delivery boy for morning distribution. Staff cannot access financial accounts or bills.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Shinde"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Mobile Number *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="tel"
                required
                placeholder="e.g. +91 9822000002"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
              />
            </div>
          </div>

          {/* Delivery Route */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Delivery Route / Area *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. Shivaji Nagar, Sector 1-4"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
              />
            </div>
          </div>

          {/* ====================================================== */}
          {/* DELIVERY STAFF LOGIN CREDENTIALS SECTION              */}
          {/* ====================================================== */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Delivery Route Portal Login</h3>
                <p className="text-[11px] text-slate-500">
                  Staff logs in using ID (e.g. D001) and a 4-digit PIN on their mobile browser.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Delivery Boy ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Staff Login ID (Format: D001) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="e.g. D001"
                    value={formData.login_id}
                    onChange={(e) => setFormData({ ...formData, login_id: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border border-slate-300 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Must begin with D followed by 3 digits.
                  </p>
                </div>

                {/* 4-Digit PIN */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      4-Digit PIN *
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePin}
                      className="inline-flex items-center gap-1 text-[11px] text-red-700 hover:text-red-800 font-semibold"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Auto Generate</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      required
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      placeholder="e.g. 5812"
                      value={formData.pin}
                      onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) })}
                      className="w-full pl-3 pr-10 py-2 text-xs font-mono tracking-widest rounded-lg border border-slate-300 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      tabIndex={-1}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Hashed with scrypt. Never stored in plaintext.
                  </p>
                </div>
              </div>

              {/* Login Enabled Checkbox */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                <input
                  type="checkbox"
                  id="enable_staff_login"
                  checked={formData.login_enabled}
                  onChange={(e) => setFormData({ ...formData, login_enabled: e.target.checked })}
                  className="rounded border-slate-300 text-red-700 focus:ring-red-700"
                />
                <label htmlFor="enable_staff_login" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Enable Route Delivery Login immediately
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <Link
              href="/admin/delivery-boys"
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Register Staff'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ONE-TIME CREDENTIAL CONFIRMATION MODAL */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Staff Registered Successfully</h3>
                <p className="text-xs text-slate-500">Share these login details with {createdCredentials.staffName}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Delivery Staff ID:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200 text-sm">
                  {createdCredentials.loginId}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">4-Digit PIN:</span>
                <span className="font-mono font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded border border-red-200 text-sm">
                  {createdCredentials.pin}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500">Portal Login URL:</span>
                <span className="font-mono text-slate-700 font-semibold">/login (Delivery Staff tab)</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 space-y-1">
              <p className="font-semibold">Security Confirmation:</p>
              <p>
                This 4-digit PIN is stored securely hashed with scrypt. Delivery staff cannot access customer bills, payments, or agency financial records.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => router.push('/admin/delivery-boys')}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Done & Return to Staff List →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
