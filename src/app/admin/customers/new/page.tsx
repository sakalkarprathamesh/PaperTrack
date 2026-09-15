'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  User,
  Phone,
  MapPin,
  Newspaper,
  Calendar,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { hashPin, validatePin, validateCustomerMobileNumber } from '@/lib/security';

export default function NewCustomerPage() {
  const router = useRouter();
  const deliveryBoys = dataService.getDeliveryBoys();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    area: '',
    delivery_boy_id: '',
    start_date: new Date().toISOString().split('T')[0],
    daily_rate: 5.0,
    advance_balance: 0,
    notes: '',
    login_id: '',
    pin: '',
    login_enabled: true,
  });

  const [showPin, setShowPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Success modal state for showing credentials only once
  const [createdCredentials, setCreatedCredentials] = useState<{
    customerId: string;
    customerName: string;
    loginId: string;
    pin: string;
  } | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData((prev) => ({
      ...prev,
      phone: digits,
      login_id: digits,
    }));
  };

  const handleGeneratePin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setFormData((prev) => ({ ...prev, pin: randomPin }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Customer name is required.');
      return;
    }

    const cleanMobile = formData.phone.trim().replace(/\D/g, '');
    const mobileCheck = validateCustomerMobileNumber(cleanMobile);
    if (!mobileCheck.valid) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    const mobile10 = mobileCheck.normalized!;

    if (!formData.address.trim()) {
      setError('Delivery address is required.');
      return;
    }
    if (!formData.area.trim()) {
      setError('Delivery area / sector is required.');
      return;
    }

    const cleanPin = formData.pin.trim();
    const pinCheck = validatePin(cleanPin);
    if (!pinCheck.valid) {
      setError('Password must contain exactly 4 digits.');
      return;
    }

    setIsSubmitting(true);
    try {
      const hashedPin = hashPin(cleanPin);

      const created = dataService.createCustomer({
        name: formData.name.trim(),
        phone: mobile10,
        address: formData.address.trim(),
        area: formData.area.trim(),
        delivery_boy_id: formData.delivery_boy_id || null,
        status: 'ACTIVE',
        start_date: formData.start_date,
        advance_balance: Number(formData.advance_balance) || 0,
        notes: formData.notes.trim() || null,
        initial_daily_rate: Number(formData.daily_rate) || 5.0,
        login_id: mobile10,
        pin_hash: hashedPin,
        login_enabled: formData.login_enabled,
      });

      // Show credentials once in confirmation modal
      setCreatedCredentials({
        customerId: created.id,
        customerName: created.name,
        loginId: mobile10,
        pin: cleanPin,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create customer');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 md:p-8">
        <div className="border-b border-slate-200 pb-5 mb-6">
          <h1 className="text-xl font-bold text-slate-900">Add New Newspaper Subscriber</h1>
          <p className="text-xs text-slate-500 mt-1">
            Register a new household for daily Lokmat newspaper morning distribution with customer portal access.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Customer Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rameshwar Deshmukh"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Customer Mobile Number *
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
                  placeholder="e.g. 9822111001"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className="w-full pl-12 pr-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Exactly 10 digits. Numbers only. Used as customer Login ID.
              </p>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Delivery Address (House/Plot/Apartment) *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 302, Sai Residency, Near Shivaji Statue"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
                />
              </div>
            </div>

            {/* Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Area / Colony / Sector *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Shivaji Nagar"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
              />
            </div>

            {/* Delivery Staff */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Assign Delivery Staff
              </label>
              <select
                value={formData.delivery_boy_id}
                onChange={(e) => setFormData({ ...formData, delivery_boy_id: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
              >
                <option value="">-- Select Delivery Staff --</option>
                {deliveryBoys.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.area})
                  </option>
                ))}
              </select>
            </div>

            {/* Newspaper & Rate */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Newspaper & Daily Rate
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800">
                  Lokmat (Marathi)
                </div>
                <div className="w-28 flex items-center border border-slate-300 rounded-lg px-2 py-1.5 bg-white">
                  <span className="text-xs text-slate-500 font-bold mr-1">₹</span>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={formData.daily_rate}
                    onChange={(e) => setFormData({ ...formData, daily_rate: parseFloat(e.target.value) || 5.0 })}
                    className="w-full text-xs font-bold text-slate-800 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">/day</span>
                </div>
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Subscription Start Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
                />
              </div>
            </div>

            {/* Initial Advance Balance */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Advance Payment (Credit) Received (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.advance_balance}
                onChange={(e) => setFormData({ ...formData, advance_balance: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
              />
            </div>
          </div>

          {/* ====================================================== */}
          {/* CUSTOMER PORTAL LOGIN CREDENTIALS SECTION              */}
          {/* ====================================================== */}
          <div className="pt-5 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Customer Login Credentials</h3>
                <p className="text-[11px] text-slate-500">
                  Allow subscriber to check their monthly bills, receipts, and delivery logs on mobile.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Login ID:</span>
                  <span className="font-mono font-bold text-slate-900">{formData.phone || '10-digit mobile number'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Password:</span>
                  <span className="font-mono font-bold text-red-700">{formData.pin ? '•••• (4-digit customer password)' : '4-digit customer password'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 10-Digit Mobile Login ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Login ID: 10-Digit Mobile Number
                  </label>
                  <input
                    type="text"
                    readOnly
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 bg-slate-100 text-slate-700 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Subscriber uses this 10-digit mobile number on customer login.
                  </p>
                </div>

                {/* 4-Digit Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Customer 4-Digit Password *
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
                      placeholder="Enter 4-digit password"
                      value={formData.pin}
                      onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) })}
                      className="w-full pl-3 pr-10 py-2 text-xs font-mono tracking-widest rounded-lg border border-slate-300 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      tabIndex={-1}
                      aria-label={showPin ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Securely hashed with scrypt. Never stored in plaintext.
                  </p>
                </div>
              </div>

              {/* Login Enabled Checkbox */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                <input
                  type="checkbox"
                  id="enable_login"
                  checked={formData.login_enabled}
                  onChange={(e) => setFormData({ ...formData, login_enabled: e.target.checked })}
                  className="rounded border-slate-300 text-red-700 focus:ring-red-700"
                />
                <label htmlFor="enable_login" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Enable Customer Portal Login immediately
                </label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Special Delivery Instructions / Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Throw paper on 2nd floor balcony; or keep in gate pouch"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <Link
              href="/admin/customers"
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save & Register Customer'}</span>
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
                <h3 className="text-base font-bold text-slate-900">Customer Registered Successfully</h3>
                <p className="text-xs text-slate-500">Share these private credentials with {createdCredentials.customerName}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Login ID (10-Digit Mobile):</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200 text-sm">
                  {createdCredentials.loginId}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">4-Digit Password:</span>
                <span className="font-mono font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded border border-red-200 text-sm">
                  {createdCredentials.pin}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500">Portal Login URL:</span>
                <span className="font-mono text-slate-700 font-semibold">/customer-login</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 space-y-1">
              <p className="font-semibold">Important Security Notice:</p>
              <p>
                This 4-digit PIN will never be shown in plain text again. It has been securely hashed in the database.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => router.push(`/admin/customers/${createdCredentials.customerId}`)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Proceed to Customer Profile →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
