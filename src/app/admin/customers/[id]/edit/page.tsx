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
import { hashPin, validatePin, validateCustomerLoginId } from '@/lib/security';
import { formatDate } from '@/lib/utils';

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const deliveryBoys = dataService.getDeliveryBoys();
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

  const [pinUpdatedAt, setPinUpdatedAt] = useState<string | null>(null);

  // New PIN reset section state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [pinSuccessMessage, setPinSuccessMessage] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const cust = dataService.getCustomerById(customerId);
    if (cust) {
      setFormData({
        name: cust.name,
        phone: cust.phone,
        address: cust.address,
        area: cust.area,
        delivery_boy_id: cust.delivery_boy_id || '',
        status: cust.status,
        notes: cust.notes || '',
        login_id: cust.login_id || cust.phone.replace(/[^0-9]/g, ''),
        login_enabled: cust.login_enabled !== undefined ? cust.login_enabled : true,
      });
      setPinUpdatedAt(cust.pin_updated_at || null);
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
    if (!formData.phone.trim()) {
      setError('Phone number is required.');
      return;
    }

    const cleanLoginId = formData.login_id.trim();
    if (cleanLoginId) {
      const idCheck = validateCustomerLoginId(cleanLoginId);
      if (!idCheck.valid) {
        setError(idCheck.error || 'Customer Login ID must contain numeric digits only.');
        return;
      }
    }

    // Check if new PIN was entered
    let updatedPinHash: string | undefined;
    if (newPin.trim()) {
      const pinCheck = validatePin(newPin);
      if (!pinCheck.valid) {
        setError(pinCheck.error || 'PIN must be exactly 4 numeric digits.');
        return;
      }
      if (newPin.trim() !== confirmPin.trim()) {
        setError('New PIN and Confirm PIN do not match.');
        return;
      }
      updatedPinHash = hashPin(newPin.trim());
    }

    setIsSubmitting(true);
    try {
      const updates: any = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        area: formData.area.trim(),
        delivery_boy_id: formData.delivery_boy_id || null,
        status: formData.status,
        notes: formData.notes.trim() || null,
        login_id: cleanLoginId || undefined,
        login_enabled: formData.login_enabled,
      };

      if (updatedPinHash) {
        updates.pin_hash = updatedPinHash;
      }

      dataService.updateCustomer(customerId, updates);

      if (newPin.trim()) {
        setPinSuccessMessage(`New 4-digit PIN (${newPin.trim()}) updated and hashed successfully! Share this with the customer.`);
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
                Mobile Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
                />
              </div>
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
          {/* CUSTOMER PORTAL CREDENTIALS & PIN MANAGEMENT           */}
          {/* ====================================================== */}
          <div className="pt-5 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Customer Portal Login & Credentials</h3>
                  <p className="text-[11px] text-slate-500">
                    Manage subscriber numeric Login ID, active login status, and 4-digit PIN.
                  </p>
                </div>
              </div>

              {pinUpdatedAt && (
                <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>PIN updated: {formatDate(pinUpdatedAt)}</span>
                </span>
              )}
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Numeric Login ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Customer Login ID (Digits Only)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.login_id}
                    onChange={(e) => setFormData({ ...formData, login_id: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="e.g. 12345 or phone digits"
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Subscriber uses this ID on the customer login tab.
                  </p>
                </div>

                {/* Login Enabled Toggle */}
                <div className="flex flex-col justify-center">
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Portal Login Status
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.login_enabled}
                      onChange={(e) => setFormData({ ...formData, login_enabled: e.target.checked })}
                      className="rounded border-slate-300 text-red-700 focus:ring-red-700"
                    />
                    <span className="text-xs font-medium text-slate-700">
                      Allow customer to log in to the portal
                    </span>
                  </label>
                </div>
              </div>

              {/* Set / Reset PIN Section */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Reset / Set New 4-Digit PIN</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleGeneratePin}
                    className="inline-flex items-center gap-1 text-[11px] text-red-700 hover:text-red-800 font-semibold"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Random PIN</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      New 4-Digit PIN
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
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Confirm New 4-Digit PIN
                    </label>
                    <input
                      type={showNewPin ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      placeholder="Re-enter 4-digit PIN"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                      className="w-full px-3 py-1.5 text-xs font-mono tracking-widest rounded-lg border border-slate-300 focus:outline-none focus:border-red-700"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 mt-2">
                  Stored PINs are never displayed in readable form and are cryptographically hashed using scrypt.
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
