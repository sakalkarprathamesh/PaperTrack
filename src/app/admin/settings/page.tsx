'use client';

import React, { useState } from 'react';
import { Settings, Save, Database, ShieldCheck, CheckCircle2, FileCode2 } from 'lucide-react';
import { dataService } from '@/lib/data-service';

export default function AgencySettingsPage() {
  const currentSettings = dataService.getAgencySettings();

  const [formData, setFormData] = useState({
    agency_name: currentSettings.agency_name,
    agency_phone: currentSettings.agency_phone,
    agency_address: currentSettings.agency_address,
    default_daily_rate: currentSettings.default_daily_rate,
    receipt_prefix: currentSettings.receipt_prefix,
    upi_id: currentSettings.upi_id || '',
  });

  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dataService.updateAgencySettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Agency Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure distribution rates, contact info on receipts, and database connection.
        </p>
      </div>

      {saved && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Agency settings updated successfully!</span>
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Agency Name (Printed on Bills)
              </label>
              <input
                type="text"
                required
                value={formData.agency_name}
                onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Agency Contact Phone
              </label>
              <input
                type="text"
                required
                value={formData.agency_phone}
                onChange={(e) => setFormData({ ...formData, agency_phone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Office / Stall Address
              </label>
              <input
                type="text"
                required
                value={formData.agency_address}
                onChange={(e) => setFormData({ ...formData, agency_address: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Default Newspaper Daily Rate (₹)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  required
                  value={formData.default_daily_rate}
                  onChange={(e) => setFormData({ ...formData, default_daily_rate: parseFloat(e.target.value) || 5.0 })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700"
                />
                <span className="text-xs text-slate-500 whitespace-nowrap">₹ / copy</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Payment Receipt Prefix
              </label>
              <input
                type="text"
                required
                value={formData.receipt_prefix}
                onChange={(e) => setFormData({ ...formData, receipt_prefix: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Agency UPI ID (For customer payment receipts)
              </label>
              <input
                type="text"
                value={formData.upi_id}
                onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-red-700"
                placeholder="e.g. papertrack@upi"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* Supabase Architecture & Production Migration Box */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Supabase PostgreSQL Architecture</h3>
            <p className="text-xs text-slate-500">Ready for cloud migration with full Row Level Security (RLS)</p>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 text-xs text-slate-600">
          <p className="flex items-center gap-2 font-bold text-slate-800">
            <FileCode2 className="w-4 h-4 text-red-700" />
            <span>Migration Files Created:</span>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-[11px] font-mono">
            <li>supabase/migrations/001_initial_schema.sql (14 Tables, RLS, Indexes)</li>
            <li>supabase/seed.sql (Admin, 2 Staff, 10 Customers, Delivery Log, Bills)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
