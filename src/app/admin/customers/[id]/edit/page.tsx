'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, User, Phone, MapPin } from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { CustomerStatus } from '@/lib/types';

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
  });

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
      });
    }
    setIsLoading(false);
  }, [customerId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return;
    }

    setIsSubmitting(true);
    try {
      dataService.updateCustomer(customerId, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        area: formData.area.trim(),
        delivery_boy_id: formData.delivery_boy_id || null,
        status: formData.status,
        notes: formData.notes.trim() || null,
      });

      router.push(`/admin/customers/${customerId}`);
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
            Update contact details, delivery address, assigned delivery staff or subscription status.
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
                Customer Name *
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
                Area / Colony *
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
                Assigned Delivery Staff
              </label>
              <select
                value={formData.delivery_boy_id}
                onChange={(e) => setFormData({ ...formData, delivery_boy_id: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
              >
                <option value="">-- Unassigned --</option>
                {deliveryBoys.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.area})
                  </option>
                ))}
              </select>
            </div>

            {/* Subscription Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Subscription Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
              >
                <option value="ACTIVE">ACTIVE (Receiving paper daily)</option>
                <option value="PAUSED">PAUSED (Temporarily stopped)</option>
                <option value="CANCELLED">CANCELLED (Terminated subscription)</option>
              </select>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Special Delivery Instructions
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <Link
              href={`/admin/customers/${customerId}`}
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
              <span>{isSubmitting ? 'Saving Changes...' : 'Update Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
