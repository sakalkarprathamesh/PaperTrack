'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  User,
  Phone,
  MapPin,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { CustomerStatus } from '@/lib/types';
import { hashPin, validatePin, validateCustomerMobileNumber } from '@/lib/security';
import { formatDate } from '@/lib/utils';

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const deliveryBoys = dataService.getDeliveryBoys();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pinSuccessMessage, setPinSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    area: '',
    delivery_boy_id: '',
    status: 'ACTIVE' as CustomerStatus,
    notes: '',
    login_id: '',
    login_enabled: true,
  });

  // PIN reset state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [pinUpdatedAt, setPinUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    const customer = dataService.getCustomerById(customerId);
    if (customer) {
      const cleanPhoneDigits = (customer.phone || '').replace(/\D/g, '').slice(-10);
      setFormData({
        name: customer.name,
        phone: cleanPhoneDigits || customer.phone || '',
        address: customer.address,
        area: customer.area,
        delivery_boy_id: customer.delivery_boy_id || '',
        status: customer.status,
        notes: customer.notes || '',
        login_id: customer.login_id || cleanPhoneDigits || '',
        login_enabled: customer.login_enabled !== undefined ? customer.login_enabled : true,
      });
      setPinUpdatedAt(customer.pin_updated_at || null);
    }
    setIsLoading(false);
  }, [customerId]);

  const handleGeneratePin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setNewPin(randomPin);
    setConfirmPin(randomPin);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPinSuccessMessage('');

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

    // Check if new PIN was entered
    let updatedPinHash: string | undefined;
    if (newPin.trim()) {
      const pinCheck = validatePin(newPin);
      if (!pinCheck.valid) {
        setError('Password must contain exactly 4 digits.');
        return;
      }
      if (newPin.trim() !== confirmPin.trim()) {
        setError('New password and confirm password do not match.');
        return;
      }
      updatedPinHash = hashPin(newPin.trim());
    }

    setIsSubmitting(true);
    try {
      const updates: any = {
        name: formData.name.trim(),
        phone: mobile10,
        address: formData.address.trim(),
        area: formData.area.trim(),
        delivery_boy_id: formData.delivery_boy_id || null,
        status: formData.status,
        notes: formData.notes.trim() || null,
        login_id: mobile10,
        login_enabled: formData.login_enabled,
      };

      if (updatedPinHash) {
        updates.pin_hash = updatedPinHash;
      }

      dataService.updateCustomer(customerId, updates);

      if (newPin.trim()) {
        setPinSuccessMessage(`New 4-digit password (${newPin.trim()}) updated successfully! Share this with the customer for /customer-login.`);
        setNewPin('');
        setConfirmPin('');
        setPinUpdatedAt(new Date().toISOString());
        setIsSubmitting(false);
      } else {
        router.push(`/admin/customers/${customerId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update customer');
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8 text-slate-500">Loading customer...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/admin/customers/${customerId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customer Profile</span>
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 md:p-8">
        <div className="border-b border-slate-200 pb-5 mb-6">
          <h1 className="text-xl font-bold text-slate-900">Edit Customer Information</h1>
          <p className="text-xs text-slate-500 mt-1">
            Update contact details, delivery address, assigned staff, status, and portal login credentials.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        {pinSuccessMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{pinSuccessMessage}</span>
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
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, phone: digits, login_id: digits });
                  }}
                  className="w-full pl-12 pr-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Exactly 10 digits. Used as customer Login ID.
              </p>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Delivery Address *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
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

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Subscription Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
              >
                <option value="ACTIVE">ACTIVE (Receiving Newspaper)</option>
                <option value="PAUSED">PAUSED (Temporary Vacation Hold)</option>
                <option value="CANCELLED">CANCELLED (Subscription Terminated)</option>
              </select>
            </div>
          </div>

          {/* ====================================================== */}
          {/* CUSTOMER LOGIN CREDENTIALS & PASSWORD MANAGEMENT       */}
          {/* ====================================================== */}
          <div className="pt-5 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Customer Login Credentials</h3>
                  <p className="text-[11px] text-slate-500">
                    Manage subscriber 10-digit mobile Login ID, active portal access, and 4-digit password.
                  </p>
                </div>
              </div>

              {pinUpdatedAt && (
                <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Password updated: {formatDate(pinUpdatedAt)}</span>
                </span>
              )}
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Login ID:</span>
                  <span className="font-mono font-bold text-slate-900">{formData.phone || '10-digit mobile number'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Password:</span>
                  <span className="font-mono font-bold text-red-700">•••• (4-digit customer password)</span>
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
                    Subscriber uses this 10-digit mobile number to log in.
                  </p>
                </div>

                {/* Login Enabled Toggle */}
                <div className="flex flex-col justify-center">
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Portal Login Access
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.login_enabled}
                      onChange={(e) => setFormData({ ...formData, login_enabled: e.target.checked })}
                      className="rounded border-slate-300 text-red-700 focus:ring-red-700"
                    />
                    <span className="text-xs font-medium text-slate-700">
                      Allow customer to log in to customer portal
                    </span>
                  </label>
                </div>
              </div>

              {/* Set / Reset Password Section */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Change Customer 4-Digit Password</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleGeneratePin}
                    className="inline-flex items-center gap-1 text-[11px] text-red-700 hover:text-red-800 font-semibold"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Random Password</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      New 4-Digit Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPin ? 'text' : 'password'}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        placeholder="Leave blank to keep current"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                        className="w-full pl-3 pr-9 py-1.5 text-xs font-mono tracking-widest rounded-lg border border-slate-300 focus:outline-none focus:border-red-700"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPin(!showNewPin)}
                        tabIndex={-1}
                        aria-label={showNewPin ? 'Hide password' : 'Show password'}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Confirm New 4-Digit Password
                    </label>
                    <input
                      type={showNewPin ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      placeholder="Re-enter 4-digit password"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                      className="w-full px-3 py-1.5 text-xs font-mono tracking-widest rounded-lg border border-slate-300 focus:outline-none focus:border-red-700"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 mt-2">
                  Stored passwords are never displayed in readable form and are cryptographically hashed using scrypt.
                </p>
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
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <Link
              href={`/admin/customers/${customerId}`}
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
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
