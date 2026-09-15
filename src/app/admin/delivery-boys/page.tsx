'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Plus,
  Phone,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Clock,
  X,
  Edit,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { DeliveryBoy } from '@/lib/types';
import { hashPin, validatePin, validateDeliveryBoyId } from '@/lib/security';
import { formatDate } from '@/lib/utils';

export default function DeliveryBoysPage() {
  const [staffList, setStaffList] = useState<any[]>([]);

  // Manage Login & PIN modal state
  const [selectedStaff, setSelectedStaff] = useState<DeliveryBoy | null>(null);
  const [modalLoginId, setModalLoginId] = useState('');
  const [modalNewPin, setModalNewPin] = useState('');
  const [modalConfirmPin, setModalConfirmPin] = useState('');
  const [modalLoginEnabled, setModalLoginEnabled] = useState(true);
  const [showModalPin, setShowModalPin] = useState(false);
  const [modalError, setModalError] = useState('');
  const [oneTimeConfirmation, setOneTimeConfirmation] = useState<{
    staffName: string;
    loginId: string;
    pin?: string;
  } | null>(null);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = () => {
    setStaffList(dataService.getDeliveryBoys());
  };

  const handleToggleActive = (id: string, current: boolean) => {
    dataService.updateDeliveryBoy(id, { is_active: !current });
    loadStaff();
  };

  const openManageModal = (boy: DeliveryBoy) => {
    setSelectedStaff(boy);
    setModalLoginId(boy.login_id || '');
    setModalLoginEnabled(boy.login_enabled !== undefined ? boy.login_enabled : true);
    setModalNewPin('');
    setModalConfirmPin('');
    setModalError('');
    setOneTimeConfirmation(null);
  };

  const handleModalGeneratePin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setModalNewPin(randomPin);
    setModalConfirmPin(randomPin);
  };

  const handleSaveStaffCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    setModalError('');

    const rawId = modalLoginId.trim();
    const idCheck = validateDeliveryBoyId(rawId);
    if (!idCheck.valid) {
      setModalError(idCheck.error || 'Delivery Staff ID must be in format D followed by 3 digits (e.g. D001).');
      return;
    }

    let updatedPinHash: string | undefined;
    if (modalNewPin.trim()) {
      const pinCheck = validatePin(modalNewPin.trim());
      if (!pinCheck.valid) {
        setModalError(pinCheck.error || 'PIN must be exactly 4 numeric digits.');
        return;
      }
      if (modalNewPin.trim() !== modalConfirmPin.trim()) {
        setModalError('New PIN and Confirm PIN do not match.');
        return;
      }
      updatedPinHash = hashPin(modalNewPin.trim());
    }

    try {
      const updates: any = {
        login_id: idCheck.normalized!,
        login_enabled: modalLoginEnabled,
      };
      if (updatedPinHash) {
        updates.pin_hash = updatedPinHash;
      }

      dataService.updateDeliveryBoy(selectedStaff.id, updates);
      loadStaff();

      if (modalNewPin.trim()) {
        setOneTimeConfirmation({
          staffName: selectedStaff.name,
          loginId: idCheck.normalized!,
          pin: modalNewPin.trim(),
        });
      } else {
        setSelectedStaff(null);
      }
    } catch (err: any) {
      setModalError(err.message || 'Failed to update credentials');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Delivery Staff Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage newspaper delivery boys, route assignments, 4-digit PINs, and daily distribution rosters.
          </p>
        </div>

        <Link
          href="/admin/delivery-boys/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Delivery Staff</span>
        </Link>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {staffList.map((boy) => (
          <div
            key={boy.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
                    {boy.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{boy.name}</h3>
                      {boy.login_id && (
                        <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                          {boy.login_id}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{boy.phone}</span>
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    boy.is_active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {boy.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    Assigned Area: <strong className="text-slate-800">{boy.area}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    Subscribers on Route:{' '}
                    <strong className="text-slate-800 font-bold">{boy.assigned_customer_count || 0}</strong>
                  </span>
                </div>

                {/* Login & PIN status badges */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100/60 text-[11px]">
                  <span className="text-slate-500">Portal Login:</span>
                  <span
                    className={`font-semibold ${
                      boy.login_enabled !== false ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {boy.login_enabled !== false ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">PIN Status:</span>
                  <span className="text-slate-700 font-mono">
                    {boy.pin_hash ? (
                      <span className="text-emerald-700 font-medium">Active (Hashed)</span>
                    ) : (
                      <span className="text-amber-600 font-medium">Not Set</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => openManageModal(boy)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-50"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                <span>Manage PIN</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(boy.id, boy.is_active)}
                  className={`text-[11px] font-semibold hover:underline ${
                    boy.is_active ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  {boy.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <Link
                  href={`/admin/delivery?deliveryBoyId=${boy.id}`}
                  className="text-red-700 font-semibold hover:underline text-[11px]"
                >
                  Checklist →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MANAGE LOGIN & PIN MODAL */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-red-700" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Manage Staff Login Credentials</h3>
                  <p className="text-xs text-slate-500">{selectedStaff.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStaff(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
                {modalError}
              </div>
            )}

            {!oneTimeConfirmation ? (
              <form onSubmit={handleSaveStaffCredentials} className="space-y-4 text-xs">
                {/* Login ID */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Staff Login ID (Format: D001) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={modalLoginId}
                    onChange={(e) => setModalLoginId(e.target.value.toUpperCase())}
                    placeholder="e.g. D001"
                    className="w-full px-3 py-2 font-mono uppercase rounded-lg border border-slate-300 focus:outline-none focus:border-red-700"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Must start with D followed by 3 digits.
                  </p>
                </div>

                {/* Login Enabled Checkbox */}
                <div>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modalLoginEnabled}
                      onChange={(e) => setModalLoginEnabled(e.target.checked)}
                      className="rounded border-slate-300 text-red-700 focus:ring-red-700"
                    />
                    <span className="font-medium text-slate-700">
                      Enable Delivery Route Login for this staff member
                    </span>
                  </label>
                </div>

                {/* Reset PIN Section */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Reset / Set New 4-Digit PIN</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleModalGeneratePin}
                      className="inline-flex items-center gap-1 text-[11px] text-red-700 hover:text-red-800 font-semibold"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Generate PIN</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        New 4-Digit PIN
                      </label>
                      <div className="relative">
                        <input
                          type={showModalPin ? 'text' : 'password'}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={4}
                          placeholder="Leave blank to keep"
                          value={modalNewPin}
                          onChange={(e) => setModalNewPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                          className="w-full pl-2.5 pr-8 py-1.5 font-mono tracking-widest rounded-lg border border-slate-300 focus:outline-none focus:border-red-700"
                        />
                        <button
                          type="button"
                          onClick={() => setShowModalPin(!showModalPin)}
                          tabIndex={-1}
                          className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                        >
                          {showModalPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Confirm New PIN
                      </label>
                      <input
                        type={showModalPin ? 'text' : 'password'}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        placeholder="Confirm 4-digit PIN"
                        value={modalConfirmPin}
                        onChange={(e) => setModalConfirmPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                        className="w-full px-2.5 py-1.5 font-mono tracking-widest rounded-lg border border-slate-300 focus:outline-none focus:border-red-700"
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    Stored PINs are never displayed in readable form and are cryptographically hashed using scrypt.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStaff(null)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold shadow-xs"
                  >
                    Save Credentials
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Staff Member:</span>
                    <span className="font-bold text-slate-900">{oneTimeConfirmation.staffName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Delivery Staff ID:</span>
                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {oneTimeConfirmation.loginId}
                    </span>
                  </div>
                  {oneTimeConfirmation.pin && (
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">New 4-Digit PIN:</span>
                      <span className="font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        {oneTimeConfirmation.pin}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-500">Login URL:</span>
                    <span className="font-mono text-slate-700 font-semibold">/login (Delivery Staff tab)</span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                  <p className="font-semibold mb-0.5">Notice:</p>
                  <p>
                    This new 4-digit PIN is stored securely hashed with scrypt. It cannot be recovered in plain text after this window closes.
                  </p>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStaff(null);
                      setOneTimeConfirmation(null);
                    }}
                    className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
