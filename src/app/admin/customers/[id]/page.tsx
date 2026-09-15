'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  Truck,
  CreditCard,
  Receipt,
  Printer,
  Edit,
  Key,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  UserCheck,
  Clock,
  Send,
  FileText,
  FileSpreadsheet,
  Lock,
  Plus,
  Trash2,
  Save,
  X,
  MessageSquare,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { Customer, Bill, Payment, DeliveryRecord, CustomerNote, SubscriptionPause } from '@/lib/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate, formatMonthYear } from '@/lib/utils';
import { hashPin } from '@/lib/security';

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [pauses, setPauses] = useState<SubscriptionPause[]>([]);

  const [activeTab, setActiveTab] = useState<'bills' | 'payments' | 'deliveries' | 'notes' | 'pauses'>('bills');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  // Internal Notes State
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // Vacation Hold (Pause) Modal State
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseStartDate, setPauseStartDate] = useState('');
  const [pauseEndDate, setPauseEndDate] = useState('');
  const [pauseReason, setPauseReason] = useState('Vacation');
  const [pauseError, setPauseError] = useState('');

  useEffect(() => {
    loadCustomerData();
  }, [customerId]);

  const loadCustomerData = () => {
    const cust = dataService.getCustomerById(customerId);
    if (!cust) return;

    setCustomer(cust);
    setBills(dataService.getBills(undefined, customerId));
    setPayments(dataService.getPayments(customerId));
    setDeliveries(
      dataService.deliveryRecords
        .filter((r) => r.customer_id === customerId)
        .sort((a, b) => b.delivery_date.localeCompare(a.delivery_date))
        .slice(0, 31)
    );
    setNotes(dataService.getCustomerNotes(customerId));
    setPauses(dataService.getPauses(customerId));
  };

  const handleCreateLogin = () => {
    const tempPin = Math.floor(1000 + Math.random() * 9000).toString();
    const pinHash = hashPin(tempPin);
    dataService.updateCustomer(customerId, { pin_hash: pinHash });
    setCustomer(dataService.getCustomerById(customerId));
    setGeneratedPassword(tempPin);
    setShowLoginModal(true);
  };

  // Internal Notes Handlers
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    try {
      dataService.createCustomerNote(customerId, newNoteText.trim(), 'Admin');
      setNewNoteText('');
      setNotes(dataService.getCustomerNotes(customerId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveEditNote = (noteId: string) => {
    if (!editingNoteText.trim()) return;
    try {
      dataService.updateCustomerNote(noteId, editingNoteText.trim());
      setEditingNoteId(null);
      setEditingNoteText('');
      setNotes(dataService.getCustomerNotes(customerId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    if (!confirm('Are you sure you want to delete this internal note?')) return;
    try {
      dataService.deleteCustomerNote(noteId);
      setNotes(dataService.getCustomerNotes(customerId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Vacation Hold (Pause) Handlers
  const handleCreatePause = (e: React.FormEvent) => {
    e.preventDefault();
    setPauseError('');
    if (!pauseStartDate || !pauseEndDate) {
      setPauseError('Start Date and Resume Date are required.');
      return;
    }
    if (pauseStartDate > pauseEndDate) {
      setPauseError('Start Date cannot be after Resume Date.');
      return;
    }

    try {
      dataService.createPause({
        customerId,
        startDate: pauseStartDate,
        endDate: pauseEndDate,
        reason: pauseReason,
        createdBy: 'Admin',
      });
      setShowPauseModal(false);
      setPauseStartDate('');
      setPauseEndDate('');
      loadCustomerData();
    } catch (err: any) {
      setPauseError(err.message);
    }
  };

  const handleResumeEarly = (pauseId: string) => {
    if (!confirm('Resume newspaper delivery today? The remaining pause hold will be cancelled.')) return;
    try {
      dataService.resumePauseEarly(pauseId);
      loadCustomerData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!customer) {
    return (
      <div className="p-8 text-slate-500">
        Customer not found.{' '}
        <Link href="/admin/customers" className="text-red-700 underline font-semibold">
          Return to directory
        </Link>
      </div>
    );
  }

  const isCleared = (customer.current_balance || 0) <= 0;
  const todayStr = new Date().toISOString().split('T')[0];
  const activePause = pauses.find((p) => p.start_date <= todayStr && p.end_date >= todayStr);

  return (
    <div className="space-y-6">
      {/* Top action bar (hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/customers/${customer.id}/ledger`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-red-700" />
            <span>Account Ledger</span>
          </Link>

          <Link
            href={`/admin/customers/${customer.id}/statement`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Statement</span>
          </Link>

          <button
            onClick={() => setShowPauseModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold shadow-xs"
          >
            <PauseCircle className="w-3.5 h-3.5 text-amber-700" />
            <span>Vacation Hold</span>
          </button>

          <button
            onClick={handleCreateLogin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
          >
            <Key className="w-3.5 h-3.5 text-slate-600" />
            <span>Customer Login</span>
          </button>

          <Link
            href={`/admin/payments/new?customerId=${customer.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Collect Payment</span>
          </Link>

          <Link
            href={`/admin/customers/${customer.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </Link>
        </div>
      </div>

      {/* Feature 6 Active Vacation Hold Alert */}
      {activePause && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <PauseCircle className="w-6 h-6 text-amber-700 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900">
                Delivery Currently Paused (Vacation Hold)
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                From {formatDate(activePause.start_date)} until {formatDate(activePause.end_date)} • Reason: {activePause.reason}
              </p>
              <p className="text-[11px] text-amber-600">
                Daily deliveries are marked as PAUSED (₹0 charged during pause period).
              </p>
            </div>
          </div>

          <button
            onClick={() => handleResumeEarly(activePause.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shrink-0 shadow-xs"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Resume Delivery Today</span>
          </button>
        </div>
      )}

      {/* 360° Customer Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs print-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900">{customer.name}</h1>
              <StatusBadge status={customer.status} />
              {isCleared ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Account Cleared</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Balance Pending</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-6 mt-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-900">{customer.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>
                  {customer.address}, <strong className="text-slate-800">{customer.area}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Member since {formatDate(customer.start_date)}</span>
              </div>
            </div>
          </div>

          {/* Balance Spotlight */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-w-[220px] text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Total Outstanding Balance
            </span>
            <p
              className={`text-3xl font-black tracking-tight mt-1 ${
                isCleared ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              {formatCurrency(customer.current_balance)}
            </p>
            {customer.advance_balance > 0 && (
              <p className="text-xs text-emerald-600 font-semibold mt-1">
                Advance Credit: {formatCurrency(customer.advance_balance)}
              </p>
            )}
          </div>
        </div>

        {/* Subscription & Delivery Staff assignment */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Subscription</span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">Lokmat Daily</p>
            <p className="text-slate-500">Rate: ₹5.00/day (Delivered Days Only)</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Delivery Staff</span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">
              {customer.delivery_boy ? customer.delivery_boy.name : 'Unassigned'}
            </p>
            <p className="text-slate-500">Route Area: {customer.area}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Private Notes</span>
            <p className="text-slate-700 mt-0.5 font-medium">
              {notes.length} internal note(s) recorded
            </p>
            <p className="text-slate-400 text-[11px]">Strictly hidden from delivery staff & customer</p>
          </div>
        </div>
      </div>

      {/* Tabs (hidden on print) */}
      <div className="flex items-center gap-2 border-b border-slate-200 no-print overflow-x-auto">
        <button
          onClick={() => setActiveTab('bills')}
          className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 shrink-0 ${
            activeTab === 'bills'
              ? 'border-red-700 text-red-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Monthly Bills ({bills.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 shrink-0 ${
            activeTab === 'payments'
              ? 'border-red-700 text-red-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment History ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('deliveries')}
          className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 shrink-0 ${
            activeTab === 'deliveries'
              ? 'border-red-700 text-red-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Daily Deliveries ({deliveries.length})</span>
        </button>

        {/* Feature 7: Internal Customer Notes Tab */}
        <button
          onClick={() => setActiveTab('notes')}
          className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 shrink-0 ${
            activeTab === 'notes'
              ? 'border-red-700 text-red-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-blue-600" />
          <span>Internal Notes ({notes.length})</span>
          <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">
            Admin Only
          </span>
        </button>

        {/* Feature 6: Vacation Holds Tab */}
        <button
          onClick={() => setActiveTab('pauses')}
          className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 shrink-0 ${
            activeTab === 'pauses'
              ? 'border-red-700 text-red-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
          <span>Vacation Holds ({pauses.length})</span>
        </button>
      </div>

      {/* Tab 1: Monthly Bills */}
      {activeTab === 'bills' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Monthly Billing History</h2>
            <Link
              href={`/admin/customers/${customer.id}/ledger`}
              className="text-xs font-bold text-red-700 hover:underline"
            >
              View Full Running Ledger →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Billing Month</th>
                  <th className="py-3 px-4 text-right">Previous Bal</th>
                  <th className="py-3 px-4 text-right">Current Charges</th>
                  <th className="py-3 px-4 text-right">Total Due</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Remaining</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No bills generated yet for this customer.
                    </td>
                  </tr>
                ) : (
                  bills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{bill.billing_month}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">{formatCurrency(bill.previous_balance)}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">{formatCurrency(bill.current_charges)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatCurrency(bill.total_due)}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700">{formatCurrency(bill.paid_amount)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-red-700">{formatCurrency(bill.remaining_amount)}</td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={bill.status} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          href={`/admin/billing/${bill.id}`}
                          className="text-xs font-semibold text-red-700 hover:underline"
                        >
                          View Bill
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Payments */}
      {activeTab === 'payments' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Payment Collection History</h2>
            <Link
              href={`/admin/payments/new?customerId=${customer.id}`}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              + Collect New Payment
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">UPI Ref / Notes</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No payment records found for this customer.
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        payment.is_reversed ? 'bg-red-50/20 line-through text-slate-400' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">{payment.receipt_number}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{formatDate(payment.payment_date)}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {payment.payment_mode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {payment.upi_reference || payment.notes || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            payment.is_reversed
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {payment.is_reversed ? 'REVERSED' : 'PAID'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Daily Deliveries */}
      {activeTab === 'deliveries' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-2">Recent Daily Delivery Log</h2>
          <p className="text-xs text-slate-500 mb-4">
            Deliveries marked by assigned route staff. Only DELIVERED days are billed at ₹5. Paused days are strictly ₹0.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {deliveries.map((del) => (
              <div
                key={del.id}
                className={`p-2.5 rounded-lg border text-center text-xs flex flex-col justify-between ${
                  del.status === 'DELIVERED'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                    : del.status === 'NOT_DELIVERED'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <span className="font-bold text-[11px] block">{formatDate(del.delivery_date)}</span>
                <span className="font-black text-xs uppercase mt-1">
                  {del.status === 'DELIVERED' ? '✓ ₹5' : del.status === 'PAUSED' ? '⏸ Paused' : '✕ Missed'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Internal Customer Notes (Feature 7) */}
      {activeTab === 'notes' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Internal Customer Notes</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  Strictly Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Maintain private notes about this customer (gate instructions, family contact for UPI, preferred morning time).
                These notes are completely hidden from delivery staff and customer portals.
              </p>
            </div>
          </div>

          {/* Add New Note Form */}
          <form onSubmit={handleAddNote} className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Add New Private Note:</label>
            <div className="flex gap-2">
              <textarea
                rows={2}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="e.g. Call customer son on 1st for UPI payment, keep paper under doormat..."
                className="flex-1 text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:border-red-600"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 self-end shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Note</span>
              </button>
            </div>
          </form>

          {/* Notes List */}
          <div className="space-y-3 pt-2">
            {notes.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center italic">
                No internal notes recorded for this customer yet.
              </p>
            ) : (
              notes.map((n) => (
                <div key={n.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  {editingNoteId === n.id ? (
                    <div className="space-y-2">
                      <textarea
                        rows={2}
                        value={editingNoteText}
                        onChange={(e) => setEditingNoteText(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setEditingNoteId(null)}
                          className="px-2.5 py-1 text-xs border border-slate-300 rounded hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEditNote(n.id)}
                          className="px-2.5 py-1 text-xs bg-red-700 text-white rounded font-bold hover:bg-red-800"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">{n.note}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingNoteId(n.id);
                            setEditingNoteText(n.note);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                          title="Edit note"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(n.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                    <span>Added by: <strong className="text-slate-600">{n.created_by || 'Admin'}</strong></span>
                    <span>{formatDate(n.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Vacation Holds (Feature 6) */}
      {activeTab === 'pauses' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Vacation Holds & Delivery Pauses</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                During vacation holds, delivery staff do not deliver and billing calculates ₹0 for paused days.
              </p>
            </div>
            <button
              onClick={() => setShowPauseModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs self-start"
            >
              <PauseCircle className="w-3.5 h-3.5" />
              <span>+ Add Vacation Hold</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {pauses.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center italic">
                No vacation holds recorded for this customer.
              </p>
            ) : (
              pauses.map((p) => {
                const isActive = p.start_date <= todayStr && p.end_date >= todayStr;
                return (
                  <div key={p.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            isActive
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isActive ? 'ACTIVE PAUSE' : 'COMPLETED'}
                        </span>
                        <h3 className="text-xs font-bold text-slate-900">
                          {formatDate(p.start_date)} to {formatDate(p.end_date)}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Reason: <strong className="text-slate-800">{p.reason}</strong>
                      </p>
                    </div>

                    {isActive && (
                      <button
                        onClick={() => handleResumeEarly(p.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Resume Early</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Feature 6 Vacation Hold Modal */}
      {showPauseModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                  <PauseCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Vacation Hold / Pause Delivery</h3>
                  <p className="text-[11px] text-slate-500">For {customer.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPauseModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pauseError && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold">
                {pauseError}
              </div>
            )}

            <form onSubmit={handleCreatePause} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Pause Start Date:</label>
                <input
                  type="date"
                  required
                  value={pauseStartDate}
                  onChange={(e) => setPauseStartDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:border-red-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Resume Date (End Date):</label>
                <input
                  type="date"
                  required
                  value={pauseEndDate}
                  onChange={(e) => setPauseEndDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:border-red-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Hold:</label>
                <select
                  value={pauseReason}
                  onChange={(e) => setPauseReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white focus:border-red-600"
                >
                  <option value="Vacation">Family Vacation</option>
                  <option value="Out of town">Out of Town</option>
                  <option value="Medical">Medical / Emergency</option>
                  <option value="House Renovation">House Renovation</option>
                  <option value="Other">Other Reason</option>
                </select>
              </div>

              <p className="text-[11px] text-slate-500">
                During this period, daily deliveries will be automatically flagged as PAUSED and calculated at ₹0 on the monthly bill.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPauseModal(false)}
                  className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Confirm Hold
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Customer Login Credentials */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-700 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Customer Portal Login</h3>
                <p className="text-xs text-slate-500">Share these private credentials with {customer.name}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500">Portal Login URL:</span>
                <span className="font-mono font-semibold text-slate-800">/login (Customer tab)</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-t border-slate-200/60">
                <span className="text-slate-500">Customer Login ID:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200 text-sm">
                  {customer.login_id || customer.phone.replace(/[^0-9]/g, '')}
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-t border-slate-200/60">
                <span className="text-slate-500">New 4-Digit PIN:</span>
                <span className="font-mono font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded border border-red-200 text-sm">
                  {generatedPassword}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              The customer can securely view their bills, receipts, payment history, and Lokmat delivery status on their phone.
              This 4-digit PIN has been cryptographically hashed with scrypt and will not be displayed again.
            </p>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowLoginModal(false)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
