'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Receipt, Eye, Printer, Download } from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { useAuth } from '@/lib/auth-context';
import { Bill } from '@/lib/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatCurrency, formatMonthYear } from '@/lib/utils';
import { exportToCSV } from '@/lib/export-csv';

export default function CustomerBillsPage() {
  const { user } = useAuth();
  const customerId = user?.customerId || '10000000-0000-0000-0000-000000000001';

  const [bills, setBills] = useState<Bill[]>([]);

  useEffect(() => {
    const list = dataService.getBills(undefined, customerId);
    setBills(list);
  }, [customerId]);

  const handleExport = () => {
    const rows = bills.map((b) => ({
      Month: b.billing_month,
      DeliveredDays: b.bill_items?.[0]?.delivered_days || 0,
      PreviousBalance: b.previous_balance,
      CurrentCharges: b.current_charges,
      TotalDue: b.total_due,
      PaidAmount: b.paid_amount,
      RemainingDue: b.remaining_amount,
      Status: b.status,
    }));
    exportToCSV('my-newspaper-bills', rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Monthly Bills</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Detailed breakdown of delivered copies of Lokmat and monthly payments.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>Export Bills</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {bills.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No bills on record yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Billing Month</th>
                  <th className="py-3 px-4 text-center">Delivered Days</th>
                  <th className="py-3 px-4 text-right">Previous Balance</th>
                  <th className="py-3 px-4 text-right">Current Charges</th>
                  <th className="py-3 px-4 text-right">Total Due</th>
                  <th className="py-3 px-4 text-right">Paid Amount</th>
                  <th className="py-3 px-4 text-right">Remaining Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatMonthYear(bill.billing_month)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                      {bill.bill_items?.[0]?.delivered_days || 0} days
                      <span className="text-[10px] text-slate-400 block">@ ₹5/day</span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500">
                      {formatCurrency(bill.previous_balance)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                      {formatCurrency(bill.current_charges)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(bill.total_due)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                      {formatCurrency(bill.paid_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-amber-800">
                      {formatCurrency(bill.remaining_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={bill.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/customer/bills/${bill.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Statement</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
