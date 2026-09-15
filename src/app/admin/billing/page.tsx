'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Calendar,
  Sparkles,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  Eye,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { Bill } from '@/lib/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatCurrency, formatMonthYear } from '@/lib/utils';
import { exportToCSV } from '@/lib/export-csv';

export default function MonthlyBillingPage() {
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [bills, setBills] = useState<Bill[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState('');

  useEffect(() => {
    loadBills();
  }, [selectedMonth, statusFilter]);

  const loadBills = () => {
    const list = dataService.getBills(
      selectedMonth !== 'ALL' ? selectedMonth : undefined,
      undefined,
      statusFilter !== 'ALL' ? statusFilter : undefined
    );
    setBills(list);
  };

  const handleGenerateBills = () => {
    setIsGenerating(true);
    try {
      const res = dataService.generateMonthlyBills(selectedMonth);
      setGenMessage(
        `Generated ${res.createdCount} new bills for ${formatMonthYear(selectedMonth)}. (${res.skippedCount} already existed)`
      );
      loadBills();
    } catch (err: any) {
      setGenMessage(`Error generating bills: ${err.message}`);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenMessage(''), 5000);
    }
  };

  const handleExport = () => {
    const rows = bills.map((b) => ({
      BillID: b.id,
      Customer: b.customer?.name || 'Customer',
      Phone: b.customer?.phone || '',
      Month: b.billing_month,
      DeliveredDays: b.bill_items?.[0]?.delivered_days || 0,
      PreviousBalance: b.previous_balance,
      CurrentCharges: b.current_charges,
      TotalDue: b.total_due,
      PaidAmount: b.paid_amount,
      RemainingDue: b.remaining_amount,
      Status: b.status,
    }));
    exportToCSV(`papertrack-bills-${selectedMonth}`, rows);
  };

  const totalCharges = bills.reduce((sum, b) => sum + (b.current_charges || 0), 0);
  const totalDue = bills.reduce((sum, b) => sum + (b.total_due || 0), 0);
  const totalPaid = bills.reduce((sum, b) => sum + (b.paid_amount || 0), 0);
  const totalRemaining = bills.reduce((sum, b) => sum + (b.remaining_amount || 0), 0);
  const clearedCount = bills.filter((b) => b.status === 'CLEARED').length;
  const pendingCount = bills.filter((b) => b.status !== 'CLEARED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Monthly Billing Center</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Auto-calculate monthly dues from actual delivered days @ ₹5/day with carry-forward balances.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Register</span>
          </button>
          <button
            onClick={handleGenerateBills}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? 'Calculating...' : `Generate ${formatMonthYear(selectedMonth)} Bills`}</span>
          </button>
        </div>
      </div>

      {genMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{genMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Bills</span>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{bills.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {clearedCount} Cleared | {pendingCount} Pending
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Current Month Charges</span>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{formatCurrency(totalCharges)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Delivered days × ₹5</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Collected</span>
          <p className="text-xl font-bold text-emerald-700 mt-0.5">{formatCurrency(totalPaid)}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Paid across bills</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Outstanding</span>
          <p className="text-xl font-bold text-amber-800 mt-0.5">{formatCurrency(totalRemaining)}</p>
          <p className="text-[11px] text-amber-700 mt-0.5">Unpaid carry-forward</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Month Selector */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Billing Month
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:border-red-700"
          >
            <option value="2026-08">August 2026</option>
            <option value="2026-09">September 2026</option>
            <option value="2026-07">July 2026</option>
            <option value="ALL">All Historical Months</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Payment Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-red-700"
          >
            <option value="ALL">All Bills (Cleared & Pending)</option>
            <option value="CLEARED">Cleared Only (Remaining: ₹0)</option>
            <option value="PARTIAL">Partial Only (Partially Paid)</option>
            <option value="PENDING">Pending Only (Unpaid)</option>
          </select>
        </div>
      </div>

      {/* Bill Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {bills.length === 0 ? (
          <EmptyState
            title="No bills found for this period"
            description="Click 'Generate Bills' to calculate monthly dues from daily delivery logs."
            action={
              <button
                onClick={handleGenerateBills}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-700 text-white font-semibold text-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate {formatMonthYear(selectedMonth)} Bills</span>
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4 text-center">Delivered Days</th>
                  <th className="py-3 px-4 text-right">Previous Balance</th>
                  <th className="py-3 px-4 text-right">Current Charges</th>
                  <th className="py-3 px-4 text-right">Total Due</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Remaining Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map((bill) => {
                  const item = bill.bill_items?.[0];
                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/admin/customers/${bill.customer_id}`}
                          className="font-bold text-slate-900 hover:text-red-700 transition-colors"
                        >
                          {bill.customer?.name || 'Customer'}
                        </Link>
                        <p className="text-[11px] text-slate-500">{bill.customer?.phone}</p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {formatMonthYear(bill.billing_month)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-slate-900">
                          {item?.delivered_days || 0} days
                        </span>
                        <span className="text-[10px] text-slate-400 block">@ ₹5.00</span>
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
                          href={`/admin/billing/${bill.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Invoice</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
