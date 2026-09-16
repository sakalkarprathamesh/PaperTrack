'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Search,
  Plus,
  Download,
  Filter,
  RotateCcw,
  Printer,
  CheckCircle2,
  XCircle,
  AlertCircle,
  IndianRupee,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { Payment } from '@/lib/types';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportToCSV } from '@/lib/export-csv';
import { useAuth } from '@/lib/auth-context';

export default function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Reversal modal state
  const [selectedPaymentForReversal, setSelectedPaymentForReversal] = useState<Payment | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [reversalError, setReversalError] = useState('');

  // Receipt popup state
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  useEffect(() => {
    loadPayments();
  }, [modeFilter, statusFilter]);

  const loadPayments = () => {
    let list = dataService.getPayments();

    if (modeFilter !== 'ALL') {
      list = list.filter((p) => p.payment_mode === modeFilter);
    }
    if (statusFilter === 'VALID') {
      list = list.filter((p) => !p.is_reversed);
    } else if (statusFilter === 'REVERSED') {
      list = list.filter((p) => p.is_reversed);
    }

    setPayments(list);
  };

  const handleReversal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentForReversal) return;
    setReversalError('');

    if (!reversalReason.trim()) {
      setReversalError('Reversal reason is mandatory');
      return;
    }

    try {
      dataService.reversePayment(
        selectedPaymentForReversal.id,
        reversalReason.trim(),
        user?.id || 'admin'
      );
      setSelectedPaymentForReversal(null);
      setReversalReason('');
      loadPayments();
    } catch (err: any) {
      setReversalError(err.message || 'Failed to reverse payment');
    }
  };

  const handleExport = () => {
    const rows = payments.map((p) => ({
      ReceiptNumber: p.receipt_number,
      Customer: p.customer?.name || 'Customer',
      Phone: p.customer?.phone || '',
      Amount: p.amount,
      PaymentMode: p.payment_mode,
      Date: p.payment_date,
      UPIReference: p.upi_reference || '',
      Status: p.is_reversed ? 'REVERSED' : 'VALID',
      ReversalReason: p.reversal_reason || '',
    }));
    exportToCSV('papertrack-payment-ledger', rows);
  };

  // Filtered by client-side search
  const filteredPayments = payments.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.receipt_number.toLowerCase().includes(q) ||
      (p.customer?.name && p.customer.name.toLowerCase().includes(q)) ||
      (p.customer?.phone && p.customer.phone.includes(q)) ||
      (p.upi_reference && p.upi_reference.toLowerCase().includes(q))
    );
  });

  const validPayments = payments.filter((p) => !p.is_reversed);
  const totalCollected = validPayments.reduce((sum, p) => sum + p.amount, 0);
  const cashTotal = validPayments.filter((p) => p.payment_mode === 'CASH').reduce((sum, p) => sum + p.amount, 0);
  const upiTotal = validPayments.filter((p) => p.payment_mode === 'UPI').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payment Collections</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track cash and UPI collections with automatic FIFO bill allocation and audit logging.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <Link
            href="/admin/payments/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Valid Collections</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalCollected)}</p>
          <p className="text-xs text-slate-500 mt-0.5">{validPayments.length} verified transactions</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Cash Collected</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(cashTotal)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Physical cash collected by Admin</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">UPI Collections</span>
          <p className="text-2xl font-bold text-purple-700 mt-1">{formatCurrency(upiTotal)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Direct to agency UPI ID</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by receipt #, customer or UPI ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
          />
        </div>

        <div>
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-red-700"
          >
            <option value="ALL">All Payment Modes</option>
            <option value="CASH">Cash Payments Only</option>
            <option value="UPI">UPI Payments Only</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-red-700"
          >
            <option value="ALL">All Statuses (Valid & Reversed)</option>
            <option value="VALID">Valid Only</option>
            <option value="REVERSED">Reversed Only</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {filteredPayments.length === 0 ? (
          <EmptyState
            title="No payment records found"
            description="Record a cash or UPI payment to update customer balances."
            action={
              <Link
                href="/admin/payments/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 text-white font-semibold text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Record Payment</span>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">UPI Reference</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      p.is_reversed ? 'bg-slate-50/70 text-slate-400' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {p.receipt_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/admin/customers/${p.customer_id}`}
                        className="font-bold text-slate-900 hover:text-red-700 transition-colors"
                      >
                        {p.customer?.name || 'Customer'}
                      </Link>
                      <p className="text-[11px] text-slate-500">{p.customer?.phone}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{formatDate(p.payment_date)}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          p.payment_mode === 'UPI'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {p.payment_mode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {p.upi_reference || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {p.is_reversed ? (
                        <span
                          title={p.reversal_reason || 'Payment reversed'}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 cursor-help"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Reversed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Valid</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => setReceiptPayment(p)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors"
                        title="View & Print Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                      {!p.is_reversed && (
                        <button
                          onClick={() => {
                            setSelectedPaymentForReversal(p);
                            setReversalReason('');
                            setReversalError('');
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded border border-rose-200 hover:bg-rose-50 text-rose-700 font-medium text-xs transition-colors"
                          title="Reverse payment with audited reason"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reverse</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Reversal Modal */}
      {selectedPaymentForReversal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reverse Payment Record</h3>
                <p className="text-xs text-slate-500">
                  Receipt: {selectedPaymentForReversal.receipt_number} ({formatCurrency(selectedPaymentForReversal.amount)})
                </p>
              </div>
            </div>

            {reversalError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-medium">
                {reversalError}
              </div>
            )}

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
              <p className="font-bold">Important Audit Notice:</p>
              <p>
                Financial records are never deleted. Reversing this payment will reopen the customer&apos;s
                unpaid bills and adjust any advance credit applied. This action is permanently logged.
              </p>
            </div>

            <form onSubmit={handleReversal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Reason for Reversal (Required) *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Wrong customer selected by error; or customer cancelled payment"
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentForReversal(null)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Confirm Reversal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Receipt Popup Modal */}
      {receiptPayment && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 print-card">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <span className="font-black text-lg text-slate-900 tracking-tight">PAPERTRACK</span>
                <p className="text-[11px] text-red-700 font-bold uppercase">Payment Receipt</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-xs text-slate-800">{receiptPayment.receipt_number}</span>
                <p className="text-[11px] text-slate-500">{formatDate(receiptPayment.payment_date)}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer Name:</span>
                <span className="font-bold text-slate-900">{receiptPayment.customer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mobile Number:</span>
                <span className="font-semibold text-slate-800">{receiptPayment.customer?.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Address:</span>
                <span className="text-slate-800 text-right max-w-xs">{receiptPayment.customer?.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="font-semibold uppercase text-slate-900">{receiptPayment.payment_mode}</span>
              </div>
              {receiptPayment.upi_reference && (
                <div className="flex justify-between">
                  <span className="text-slate-500">UPI Ref:</span>
                  <span className="font-mono text-slate-800">{receiptPayment.upi_reference}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between text-base font-black">
                <span className="text-slate-900">Amount Received:</span>
                <span className="text-emerald-700">{formatCurrency(receiptPayment.amount)}</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 flex items-center justify-between no-print">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setReceiptPayment(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
