'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  IndianRupee,
  CheckCircle2,
  Clock,
  Receipt,
  CreditCard,
  Newspaper,
  ArrowRight,
  Phone,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency, formatDate, formatMonthYear } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/StatusBadge';

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const customerId = user?.customerId;

  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (customerId) {
      const s = dataService.getCustomerDashboardStats(customerId);
      setStats(s);
    }
  }, [customerId]);

  if (!customerId) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3 my-8">
        <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">No Subscriber Profile Linked</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          We could not locate an active newspaper subscription record for this account. Please contact your agency administrator.
        </p>
      </div>
    );
  }

  if (!stats) return <div className="p-8 text-slate-500">Loading your dashboard...</div>;

  const isCleared = (stats.currentBalance || 0) <= 0;
  const settings = dataService.getAgencySettings();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2 py-0.5 rounded">
            Lokmat Daily Subscriber
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Namaskar, {stats.customer?.name || 'Subscriber'}!
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {stats.customer?.address || 'Subscriber Portal'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/customer/bills"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-xs"
          >
            <Receipt className="w-4 h-4" />
            <span>View Bills</span>
          </Link>
          <Link
            href="/customer/payments"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
          >
            <CreditCard className="w-4 h-4" />
            <span>Receipts</span>
          </Link>
        </div>
      </div>

      {/* Account Balance Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Current Account Balance
          </span>
          <div className="flex items-center gap-3 mt-1">
            <p
              className={`text-3xl font-black tracking-tight ${
                isCleared ? 'text-emerald-700' : 'text-amber-800'
              }`}
            >
              {formatCurrency(stats.currentBalance)}
            </p>
            {isCleared ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>All Cleared</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Balance</span>
              </span>
            )}
          </div>
          {stats.advanceBalance > 0 && (
            <p className="text-xs text-emerald-600 font-semibold mt-1">
              Advance Credit Balance: {formatCurrency(stats.advanceBalance)}
            </p>
          )}
        </div>

        {/* UPI Payment Info */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-1 sm:max-w-xs">
          <p className="font-bold text-slate-800">To Pay via UPI:</p>
          <p className="text-slate-600">Send to Agency UPI ID:</p>
          <p className="font-mono font-bold text-red-700 bg-white border border-slate-200 px-2 py-1 rounded">
            {settings.upi_id}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            Admin will record your payment and SMS/issue a receipt.
          </p>
        </div>
      </div>

      {/* Grid of Latest Bill & Last Payment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Latest Bill Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-slate-400">Latest Monthly Bill</span>
              {stats.latestBill && <StatusBadge status={stats.latestBill.status} />}
            </div>

            {stats.latestBill ? (
              <div className="space-y-2 text-xs">
                <h3 className="text-lg font-bold text-slate-900">
                  {formatMonthYear(stats.latestBill.billing_month)}
                </h3>
                <div className="flex justify-between text-slate-600">
                  <span>Actual Delivered Days:</span>
                  <span className="font-bold text-slate-900">
                    {stats.latestBill.bill_items?.[0]?.delivered_days || 0} days (@ ₹5/day)
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Current Month Charges:</span>
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(stats.latestBill.current_charges)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Amount Paid:</span>
                  <span className="font-semibold text-emerald-700">
                    {formatCurrency(stats.latestBill.paid_amount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-slate-100 pt-2">
                  <span>Remaining Due:</span>
                  <span className={stats.latestBill.remaining_amount <= 0 ? 'text-emerald-700' : 'text-amber-800'}>
                    {formatCurrency(stats.latestBill.remaining_amount)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No bills generated yet.</p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/customer/bills"
              className="text-xs font-semibold text-red-700 hover:text-red-800 flex items-center gap-1"
            >
              <span>View All Past Bills</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Last Payment Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-slate-400">Last Payment Made</span>
              <CreditCard className="w-4 h-4 text-emerald-600" />
            </div>

            {stats.lastPayment ? (
              <div className="space-y-2 text-xs">
                <p className="text-2xl font-black text-emerald-700">
                  {formatCurrency(stats.lastPayment.amount)}
                </p>
                <div className="flex justify-between text-slate-600">
                  <span>Payment Date:</span>
                  <span className="font-semibold text-slate-800">
                    {formatDate(stats.lastPayment.payment_date)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Payment Mode:</span>
                  <span className="font-semibold uppercase text-slate-800">
                    {stats.lastPayment.payment_mode}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Receipt #:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {stats.lastPayment.receipt_number}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No payments recorded yet.</p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/customer/payments"
              className="text-xs font-semibold text-red-700 hover:text-red-800 flex items-center gap-1"
            >
              <span>View All Payment Receipts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
