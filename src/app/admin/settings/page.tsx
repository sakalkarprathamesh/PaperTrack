'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Database,
  ShieldCheck,
  CheckCircle2,
  FileCode2,
  Lock,
  Eye,
  EyeOff,
  User,
  AlertCircle,
  Users,
  KeyRound,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';

export default function AgencySettingsPage() {
  const { user, isConfigured, updateProfile } = useAuth();
  const currentSettings = dataService.getAgencySettings();

  const [formData, setFormData] = useState({
    admin_display_name: user?.fullName || 'Admin (Agency Owner)',
    agency_name: currentSettings.agency_name,
    agency_phone: currentSettings.agency_phone,
    agency_address: currentSettings.agency_address,
    default_daily_rate: currentSettings.default_daily_rate,
    receipt_prefix: currentSettings.receipt_prefix,
    upi_id: currentSettings.upi_id || '',
  });

  const [saved, setSaved] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  // Sync admin display name when user profile loads/updates
  useEffect(() => {
    if (user?.fullName) {
      setFormData((prev) => ({
        ...prev,
        admin_display_name: user.fullName,
      }));
    }
  }, [user?.fullName]);

  // Admin Password Change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Migration status counts
  const [migrationStats, setMigrationStats] = useState({
    totalCustomers: 0,
    customersWithPin: 0,
    totalDeliveryBoys: 0,
    deliveryBoysWithDId: 0,
  });

  useEffect(() => {
    const customers = dataService.getCustomers();
    const deliveryBoys = dataService.getDeliveryBoys();

    setMigrationStats({
      totalCustomers: customers.length,
      customersWithPin: customers.filter((c) => Boolean(c.pin_hash)).length,
      totalDeliveryBoys: deliveryBoys.length,
      deliveryBoysWithDId: deliveryBoys.filter((b) => Boolean(b.login_id && /^D\d{3}$/i.test(b.login_id))).length,
    });
  }, []);

  const handleSubmitSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError('');
    setSaved(false);

    const trimmedAdminName = formData.admin_display_name.trim();
    if (!trimmedAdminName || trimmedAdminName.length < 2) {
      setSettingsError('Admin display name must be at least 2 characters long.');
      return;
    }

    setSettingsLoading(true);
    try {
      // 1. Update Admin display name in Supabase profiles via AuthContext
      const profileResult = await updateProfile({ fullName: trimmedAdminName });
      if (!profileResult.success) {
        throw new Error(profileResult.error || 'Failed to update admin display name in database.');
      }

      // 2. Persist agency settings to Supabase if configured
      if (isConfigured) {
        const supabase = createClient();
        const { error: agencyDbError } = await supabase
          .from('agency_settings')
          .update({
            agency_name: formData.agency_name.trim(),
            agency_phone: formData.agency_phone.trim(),
            agency_address: formData.agency_address.trim(),
            default_daily_rate: Number(formData.default_daily_rate) || 5.0,
            receipt_prefix: formData.receipt_prefix.trim(),
            upi_id: formData.upi_id.trim(),
            updated_at: new Date().toISOString(),
          })
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (agencyDbError) {
          console.warn('Supabase agency_settings update notice:', agencyDbError.message);
        }
      }

      // 3. Keep local dataService in sync
      dataService.updateAgencySettings({
        agency_name: formData.agency_name.trim(),
        agency_phone: formData.agency_phone.trim(),
        agency_address: formData.agency_address.trim(),
        default_daily_rate: Number(formData.default_daily_rate) || 5.0,
        receipt_prefix: formData.receipt_prefix.trim(),
        upi_id: formData.upi_id.trim(),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (err: any) {
      setSettingsError(err.message || 'Unable to save settings. Please try again.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      if (isConfigured) {
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) throw error;
      }
      setPasswordSuccess('Admin password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update admin password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Agency & Admin Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure distribution rates, agency info on receipts, admin password, and authentication migration status.
        </p>
      </div>

      {saved && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Agency settings updated successfully!</span>
        </div>
      )}

      {settingsError && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{settingsError}</span>
        </div>
      )}

      {/* Agency Details Form */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 md:p-8">
        <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
          <Settings className="w-4 h-4 text-red-700" />
          <h2 className="text-sm font-bold text-slate-900">Agency Information & Billing Settings</h2>
        </div>

        <form onSubmit={handleSubmitSettings} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Admin Display Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={formData.admin_display_name}
                  onChange={(e) => setFormData({ ...formData, admin_display_name: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700"
                />
              </div>
            </div>

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

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Agency UPI ID (For customer receipts)
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
              disabled={settingsLoading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{settingsLoading ? 'Saving Settings...' : 'Save Agency Details'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Admin Password Change Form */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 md:p-8">
        <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
          <Lock className="w-4 h-4 text-red-700" />
          <h2 className="text-sm font-bold text-slate-900">Change Admin Password</h2>
        </div>

        {passwordSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                New Password (Minimum 8 Characters)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={passwordLoading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{passwordLoading ? 'Updating Password...' : 'Update Admin Password'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Migration & Credentials Audit Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Authentication Migration & Credentials Audit</h3>
            <p className="text-xs text-slate-500">Overview of 4-digit PIN setup and delivery staff credentials</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Users className="w-4 h-4 text-red-700" />
              <span>Customer PINs Configured</span>
            </div>
            <p className="text-xl font-bold text-slate-900">
              {migrationStats.customersWithPin} / {migrationStats.totalCustomers}
            </p>
            <p className="text-[11px] text-slate-500">
              Subscribers with active scrypt hashed 4-digit PINs.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <KeyRound className="w-4 h-4 text-red-700" />
              <span>Delivery Staff IDs (D-Format)</span>
            </div>
            <p className="text-xl font-bold text-slate-900">
              {migrationStats.deliveryBoysWithDId} / {migrationStats.totalDeliveryBoys}
            </p>
            <p className="text-[11px] text-slate-500">
              Staff members with standardized D001-style IDs.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 text-xs text-slate-600">
          <p className="flex items-center gap-2 font-bold text-slate-800">
            <FileCode2 className="w-4 h-4 text-red-700" />
            <span>Database Migration Files:</span>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-[11px] font-mono">
            <li>supabase/migrations/001_initial_schema.sql (14 Tables, RLS, Indexes)</li>
            <li>supabase/migrations/004_customer_and_delivery_boy_pin_auth.sql (PIN & Login IDs)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
