'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Printer, Newspaper, CheckCircle2, AlertCircle } from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { useAuth } from '@/lib/auth-context';
import { Bill } from '@/lib/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate, formatMonthYear } from '@/lib/utils';

export default function CustomerBillDetailPage() {
  const params = useParams();
  const billId = params.id as string;
  const { user } = useAuth();
  const customerId = user?.customerId || '10000000-0000-0000-0000-000000000001';

  const [bill, setBill] = useState<Bill | null>(null);

  useEffect(() => {
    const b = dataService.getBillById(billId);
    // Security check: Customer can only view their own bill
    if (b && b.customer_id === customerId) {
      setBill(b);
    } else {
      setBill(null);
    }
  }, [billId, customerId]);

  if (!bill) {
    return (
      <div className="p-8 text-slate-500">
        Bill not found or you do not have permission to view it.{' '}
        <Link href="/customer/bills" className="text-red-700 underline font-semibold">
          Return to bills
        </Link>
      </div>
    );
  }

  const settings = dataService.getAgencySettings();
  const isCleared = (bill.remaining_amount || 0) <= 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/customer/bills"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Bills</span>
        </Link>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Statement</span>
        </button>
      </div>

      {/* Invoice Card */}
      <div className="bg-white border border-slate-300 rounded-xl p-6 sm:p-8 shadow-xs print-card space-y-6">
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-red-700 text-white flex items-center justify-center font-bold">
                <Newspaper className="w-5 h-5" />
              </div>
              <span className="font-black text-lg text-slate-900 tracking-tight">PAPERTRACK</span>
            </div>
            <p className="text-xs font-bold text-red-700 mt-1 uppercase">{settings.agency_name}</p>
            <p className="text-xs text-slate-500">Phone: {settings.agency_phone}</p>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold uppercase text-slate-400 block">Statement</span>
            <p className="text-base font-mono font-bold text-slate-900">
              INV-{bill.billing_month.replace('-', '')}-{bill.id.substring(bill.id.length - 4)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{formatMonthYear(bill.billing_month)}</p>
            <div className="mt-1">
              <StatusBadge status={bill.status} />
            </div>
          </div>
        </div>

        {/* Customer info */}
        <div className="text-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
            Subscriber Details
          </span>
          <p className="text-sm font-bold text-slate-900 mt-0.5">{bill.customer?.name}</p>
          <p className="text-slate-600">{bill.customer?.address}</p>
          <p className="text-slate-600">Area: {bill.customer?.area}</p>
        </div>

        {/* Itemized delivered days */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
              <tr>
                <th className="py-2.5 px-3">Newspaper</th>
                <th className="py-2.5 px-3 text-center">Delivered Copies</th>
                <th className="py-2.5 px-3 text-right">Rate</th>
                <th className="py-2.5 px-3 text-right">Charges</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bill.bill_items?.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 px-3 font-semibold text-slate-800">{item.description}</td>
                  <td className="py-3 px-3 text-center font-bold text-slate-900">{item.delivered_days} days</td>
                  <td className="py-3 px-3 text-right text-slate-600">{formatCurrency(item.daily_rate)}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation breakdown */}
        <div className="flex justify-end pt-2">
          <div className="w-64 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Current Month:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(bill.current_charges)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Previous Balance:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(bill.previous_balance)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900">
              <span>Total Amount:</span>
              <span>{formatCurrency(bill.total_due)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Paid Amount:</span>
              <span>- {formatCurrency(bill.paid_amount)}</span>
            </div>
            <div className="flex justify-between border-t-2 border-slate-900 pt-2 text-sm font-black">
              <span>Remaining Balance:</span>
              <span className={isCleared ? 'text-emerald-700' : 'text-amber-800'}>
                {formatCurrency(bill.remaining_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* UPI Payment prompt */}
        {!isCleared && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="font-bold text-slate-800">Pay via UPI:</p>
              <p className="text-slate-600">Transfer pending dues to {settings.upi_id}</p>
            </div>
            <p className="font-mono font-bold text-red-700 bg-white border border-slate-200 px-2 py-1 rounded text-center">
              {settings.upi_id}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
