'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  CreditCard,
  IndianRupee,
  Calendar,
  CheckCircle2,
  Printer,
  Sparkles,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { Customer, PaymentMode, Payment } from '@/lib/types';
import { allocatePayment } from '@/lib/billing-engine';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function NewPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedCustomerId = searchParams.get('customerId');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(preSelectedCustomerId || '');
  const [customerSearch, setCustomerSearch] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [upiReference, setUpiReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedPayment, setCompletedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    const list = dataService.getCustomers();
    setCustomers(list);
    if (preSelectedCustomerId) {
      setSelectedCustomerId(preSelectedCustomerId);
    }
  }, [preSelectedCustomerId]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || null;

  // Real-time allocation preview calculation
  const outstandingBills = selectedCustomer
    ? dataService.bills
        .filter((b) => b.customer_id === selectedCustomer.id && b.remaining_amount > 0)
        .sort((a, b) => a.billing_month.localeCompare(b.billing_month))
    : [];

  const numericAmount = parseFloat(amount) || 0;
  let previewAllocations: any = null;

  if (selectedCustomer && numericAmount > 0) {
    try {
      previewAllocations = allocatePayment({
        paymentAmount: numericAmount,
        outstandingBills,
        currentAdvanceBalance: selectedCustomer.advance_balance || 0,
      });
    } catch {
      previewAllocations = null;
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomerId) {
      setError('Please select a customer');
      return;
    }
    if (numericAmount <= 0) {
      setError('Please enter a valid payment amount greater than ₹0');
      return;
    }
    if (paymentMode === 'UPI' && !upiReference.trim()) {
      setError('Please enter the UPI transaction reference or ID');
      return;
    }

    setIsSubmitting(true);
    try {
      const payment = dataService.recordPayment({
        customerId: selectedCustomerId,
        amount: numericAmount,
        paymentMode,
        paymentDate,
        upiReference: paymentMode === 'UPI' ? upiReference.trim() : undefined,
        notes: notes.trim() || undefined,
        recordedBy: 'a0000000-0000-0000-0000-000000000001',
      });

      setCompletedPayment(payment);
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link
          href="/admin/payments"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Payments</span>
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 md:p-8">
        <div className="border-b border-slate-200 pb-5 mb-6">
          <h1 className="text-xl font-bold text-slate-900">Record Customer Payment</h1>
          <p className="text-xs text-slate-500 mt-1">
            Accept Cash or UPI. System will automatically clear oldest bills first and preserve any excess as advance credit.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Subscriber *
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) - Due: {formatCurrency(c.current_balance)}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Current Balance Card */}
          {selectedCustomer && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900">{selectedCustomer.name}</p>
                <p className="text-slate-500">{selectedCustomer.address} ({selectedCustomer.area})</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Outstanding</span>
                <p className="text-lg font-black text-amber-800">
                  {formatCurrency(selectedCustomer.current_balance)}
                </p>
                {selectedCustomer.advance_balance > 0 && (
                  <p className="text-[10px] text-emerald-600 font-semibold">
                    Current Advance: {formatCurrency(selectedCustomer.advance_balance)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Payment Amount & Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Amount Received (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400 text-xs">₹</span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  placeholder="e.g. 150"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-sm font-bold text-slate-900 rounded-lg border border-slate-300 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Payment Mode *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode('CASH')}
                  className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                    paymentMode === 'CASH'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  💵 Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('UPI')}
                  className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                    paymentMode === 'UPI'
                      ? 'bg-purple-50 border-purple-600 text-purple-800'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  📱 UPI / Online
                </button>
              </div>
            </div>
          </div>

          {/* UPI Reference if UPI selected */}
          {paymentMode === 'UPI' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                UPI Reference / UTR Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. UPI847294819284 or PhonePe transaction ID"
                value={upiReference}
                onChange={(e) => setUpiReference(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-red-700"
              />
            </div>
          )}

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Payment Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Handed in cash at agency office"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-red-700"
            />
          </div>

          {/* Live FIFO Allocation Preview */}
          {previewAllocations && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Auto-Allocation Preview (FIFO):</span>
              </div>
              {previewAllocations.allocations.length > 0 ? (
                previewAllocations.allocations.map((a: any) => (
                  <div key={a.billId} className="flex justify-between text-slate-600 pl-5">
                    <span>Applied to bill {a.billId.substring(a.billId.length - 8)}:</span>
                    <span className="font-semibold text-emerald-700">
                      {formatCurrency(a.allocatedAmount)} ({a.newStatus})
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 pl-5">No pending bills. Full amount will be credited to advance balance.</p>
              )}
              {previewAllocations.newAdvanceBalance > 0 && (
                <div className="flex justify-between font-bold text-emerald-800 pl-5 pt-1 border-t border-slate-200">
                  <span>Advance Credit Balance:</span>
                  <span>{formatCurrency(previewAllocations.newAdvanceBalance)}</span>
                </div>
              )}
            </div>
          )}

          {/* Submit buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <Link
              href="/admin/payments"
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : 'Confirm & Generate Receipt'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Success Receipt Modal */}
      {completedPayment && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 print-card">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Payment Successfully Recorded!</span>
            </div>

            <div className="border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt #:</span>
                <span className="font-mono font-bold text-slate-900">{completedPayment.receipt_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-800">{selectedCustomer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Date:</span>
                <span className="text-slate-800">{formatDate(completedPayment.payment_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mode:</span>
                <span className="font-semibold uppercase text-slate-800">{completedPayment.payment_mode}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-black">
                <span className="text-slate-900">Total Paid:</span>
                <span className="text-emerald-700">{formatCurrency(completedPayment.amount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between no-print pt-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => router.push(`/admin/customers/${selectedCustomerId}`)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
              >
                View Customer Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
