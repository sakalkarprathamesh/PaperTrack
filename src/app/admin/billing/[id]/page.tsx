'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Printer, Newspaper, CheckCircle2, AlertCircle, CreditCard } from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { Bill } from '@/lib/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate, formatMonthYear } from '@/lib/utils';

export default function BillDetailPage() {
  const params = useParams();
  const billId = params.id as string;
  const [bill, setBill] = useState<Bill | null>(null);

  useEffect(() => {
    const b = dataService.getBillById(billId);
    setBill(b);
  }, [billId]);

  if (!bill) {
    return (
      <div className="p-8 text-slate-500">
        Bill not found.{' '}
        <Link href="/admin/billing" className="text-red-700 underline font-semibold">
          Return to billing
        </Link>
      </div>
    );
  }

  const settings = dataService.getAgencySettings();
  const isCleared = (bill.remaining_amount || 0) <= 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Action Header (Hidden on print) */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/admin/billing"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Monthly Bills</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
          {!isCleared && (
            <Link
              href={`/admin/payments/new?customerId=${bill.customer_id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs"
            >
              <CreditCard className="w-4 h-4" />
              <span>Collect Payment</span>
            </Link>
          )}
        </div>
      </div>

      {/* Invoice Card */}
      <div className="bg-white border border-slate-300 rounded-xl p-8 shadow-xs print-card space-y-6">
        {/* Letterhead Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-red-700 text-white flex items-center justify-center font-bold">
                <Newspaper className="w-5 h-5" />
              </div>
              <span className="font-black text-xl tracking-tight text-slate-900">PAPERTRACK</span>
            </div>
            <p className="text-xs font-bold text-red-700 mt-1 uppercase tracking-wider">
              {settings.agency_name}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{settings.agency_address}</p>
            <p className="text-xs text-slate-500">Phone: {settings.agency_phone}</p>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block">
              Newspaper Bill
            </span>
            <p className="text-lg font-mono font-bold text-slate-900 mt-0.5">
              INV-{bill.billing_month.replace('-', '')}-{bill.id.substring(bill.id.length - 4)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Billing Period: <strong className="text-slate-800">{formatMonthYear(bill.billing_month)}</strong>
            </p>
            <div className="mt-2">
              <StatusBadge status={bill.status} />
            </div>
          </div>
        </div>

        {/* Billed To Customer */}
        <div className="grid grid-cols-2 gap-6 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">
              Billed To Subscriber
            </span>
            <p className="text-base font-bold text-slate-900">{bill.customer?.name}</p>
            <p className="text-slate-600 mt-0.5">{bill.customer?.address}</p>
            <p className="text-slate-600">Area: {bill.customer?.area}</p>
            <p className="text-slate-600 font-semibold mt-1">Mobile: {bill.customer?.phone}</p>
          </div>

          <div className="text-right">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">
              Bill Summary
            </span>
            <div className="space-y-1 text-xs">
              <p className="text-slate-600">
                Generated Date: <span className="font-semibold text-slate-800">{formatDate(bill.generated_at)}</span>
              </p>
              <p className="text-slate-600">
                Daily Rate: <span className="font-semibold text-slate-800">₹5.00 / copy</span>
              </p>
              <p className="text-slate-600">
                Billing Method: <span className="font-semibold text-slate-800">Actual Delivered Days</span>
              </p>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Item & Description</th>
                <th className="py-2.5 px-4 text-center">Actual Delivered Days</th>
                <th className="py-2.5 px-4 text-right">Daily Rate</th>
                <th className="py-2.5 px-4 text-right">Total Charges</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bill.bill_items?.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 px-4 font-semibold text-slate-800">{item.description}</td>
                  <td className="py-3 px-4 text-center font-bold text-slate-900">{item.delivered_days} days</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-600">
                    {formatCurrency(item.daily_rate)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Calculation Breakdown */}
        <div className="flex justify-end pt-2">
          <div className="w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Current Month Charges:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(bill.current_charges)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Previous Carry-Forward Balance:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(bill.previous_balance)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-slate-900 font-bold">
              <span>Total Amount Due:</span>
              <span>{formatCurrency(bill.total_due)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Paid / Advance Applied:</span>
              <span>- {formatCurrency(bill.paid_amount)}</span>
            </div>
            <div className="flex justify-between border-t-2 border-slate-900 pt-2 text-sm font-black">
              <span>Remaining Amount Due:</span>
              <span className={isCleared ? 'text-emerald-700' : 'text-red-700'}>
                {formatCurrency(bill.remaining_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="border-t border-slate-200 pt-4 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Payments accepted via Cash or UPI ({settings.upi_id}). Thank you!</span>
          <span className="font-mono text-[10px] text-slate-400">PaperTrack Verification: VERIFIED</span>
        </div>
      </div>
    </div>
  );
}
