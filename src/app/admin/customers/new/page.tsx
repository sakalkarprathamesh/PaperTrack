'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, User, Phone, MapPin, Newspaper, Calendar } from 'lucide-react';
import { dataService } from '@/lib/data-service';

export default function NewCustomerPage() {
  const router = useRouter();
  const deliveryBoys = dataService.getDeliveryBoys();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    area: '',
    delivery_boy_id: deliveryBoys[0]?.id || '',
    daily_rate: 5.0,
    start_date: new Date().toISOString().split('T')[0],
    advance_balance: 0.0,
    notes: '',
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      setError('Valid 10-digit phone number is required');
      return;
    }
    if (!formData.address.trim()) {
      setError('Delivery address is required');
      return;
    }
    if (!formData.area.trim()) {
      setError('Delivery area / sector is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = dataService.createCustomer({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        area: formData.area.trim(),
        delivery_boy_id: formData.delivery_boy_id || null,
        status: 'ACTIVE',
        start_date: formData.start_date,
        advance_balance: Number(formData.advance_balance) || 0,
        notes: formData.notes.trim() || null,
        initial_daily_rate: Number(formData.daily_rate) || 5.0,
      });

      router.push(`/admin/customers/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create customer');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
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
            Register a new household for daily Lokmat newspaper morning distribution.
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
                Mobile Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 9822334455"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
                />
              </div>
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

            {/* Delivery Boy */}
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
              <p className="text-[10px] text-slate-400 mt-1">
                Enter any advance deposit paid upfront in cash.
              </p>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
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
              <span>{isSubmitting ? 'Saving...' : 'Save & Subscribe'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
