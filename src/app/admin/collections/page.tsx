'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  IndianRupee,
  Calendar,
  CreditCard,
  Printer,
  Download,
  Filter,
  CheckCircle2,
  RotateCcw,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Banknote,
  Smartphone,
  FileText,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { CollectionReport, CollectionTransaction } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportToCSV } from '@/lib/export-csv';

export default function CollectionsPage() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [activeView, setActiveView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [report, setReport] = useState<CollectionReport | null>(null);
  const [summaries, setSummaries] = useState<{ monthly: any[] }>({ monthly: [] });

  useEffect(() => {
    loadReport();
  }, [selectedDate, startDate, endDate, activeView]);

  const loadReport = () => {
    if (activeView === 'daily') {
      const data = dataService.getDailyCollectionReport({
        date: startDate || endDate ? undefined : selectedDate,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setReport(data);
    }

    const sum = dataService.getCollectionSummaries();
    setSummaries(sum);
  };

  const handleExportCSV = () => {
    if (!report) return;

    const rows = report.transactions.map((t) => ({
      date: t.date,
      time: t.time,
      receipt_number: t.receiptNumber,
      customer_name: t.customerName,
      area: t.area,
      amount: t.amount.toFixed(2),
      payment_mode: t.mode,
      recorded_by: t.recordedBy || 'Admin',
      status: t.status,
      reversal_reason: t.reversalReason || '',
    }));

    exportToCSV(`Collections_${report.date.replace(/[^a-zA-Z0-9]/g, '_')}`, rows, [
      { key: 'date', label: 'Payment Date' },
      { key: 'time', label: 'Time' },
      { key: 'receipt_number', label: 'Receipt #' },
      { key: 'customer_name', label: 'Customer' },
      { key: 'area', label: 'Area' },
      { key: 'amount', label: 'Amount (₹)' },
      { key: 'payment_mode', label: 'Mode (Cash/UPI)' },
      { key: 'recorded_by', label: 'Recorded By' },
      { key: 'status', label: 'Status' },
      { key: 'reversal_reason', label: 'Reversal Reason' },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-xl p-6 shadow-xs no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Agency Cashflow
            </span>
            <span className="text-xs text-slate-500">Daily & Periodic Collections</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Collection Register & Reports
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track daily cash handed by delivery staff, instant UPI collections, audited reversals, and reconciliation slips.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Slip</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <Link
            href="/admin/payments/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>+ Collect Payment</span>
          </Link>
        </div>
      </div>

      {/* View Switcher Tabs (no-print) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 no-print">
        <button
          onClick={() => setActiveView('daily')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeView === 'daily'
              ? 'bg-red-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Daily & Date Range View
        </button>
        <button
          onClick={() => setActiveView('monthly')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeView === 'monthly'
              ? 'bg-red-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Monthly Summary Breakdown
        </button>
      </div>

      {/* View Mode 1: Daily Register */}
      {activeView === 'daily' && report && (
        <div className="space-y-6">
          {/* Date Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">Filter By Date:</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500">Single Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-red-600"
                />
              </div>

              <span className="text-xs text-slate-400">or Range:</span>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setSelectedDate('');
                  }}
                  className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-red-600"
                  placeholder="From"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setSelectedDate('');
                  }}
                  className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-red-600"
                  placeholder="To"
                />
              </div>

              {(startDate || endDate || selectedDate !== todayStr) && (
                <button
                  onClick={() => {
                    setSelectedDate(todayStr);
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-xs font-semibold text-red-700 hover:text-red-800"
                >
                  Reset Today
                </button>
              )}
            </div>
          </div>

          {/* Collection KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Net Collection</span>
                <IndianRupee className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-700 mt-2">
                {formatCurrency(report.totalCollected)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {report.paymentCount} completed payment(s)
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Cash Collection</span>
                <Banknote className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">
                {formatCurrency(report.cashCollected)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Cash in hand with delivery staff</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">UPI Collection</span>
                <Smartphone className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-black text-purple-700 mt-2">
                {formatCurrency(report.upiCollected)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Direct to agency bank account</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Reversals (Excluded)</span>
                <RotateCcw className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-2xl font-black text-slate-400 mt-2">
                {formatCurrency(report.reversedAmount)}
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                {report.reversedCount} reversed transaction(s)
              </p>
            </div>
          </div>

          {/* Collection Transactions Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden print-card">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Collection Register — {report.date}
                </h2>
                <p className="text-xs text-slate-500">
                  Detailed payment list with receipt numbers and payment mode verification
                </p>
              </div>
              <div className="text-xs font-mono font-semibold text-slate-600">
                Net Total: <span className="text-emerald-700 font-bold">{formatCurrency(report.totalCollected)}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Date / Time</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Area</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Recorded By</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        No payment collections recorded for this date.
                      </td>
                    </tr>
                  ) : (
                    report.transactions.map((t) => (
                      <tr
                        key={t.id}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          t.status === 'REVERSED' ? 'bg-red-50/20 line-through text-slate-400' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">
                          {t.receiptNumber}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                          {formatDate(t.date)} <span className="text-slate-400 text-[10px]">({t.time})</span>
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            href={`/admin/customers/${t.customerId}`}
                            className="font-bold text-slate-900 hover:text-red-700 transition-colors"
                          >
                            {t.customerName}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{t.area}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.mode === 'UPI'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {t.mode}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(t.amount)}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{t.recordedBy}</td>
                        <td className="py-3 px-4 text-center">
                          {t.status === 'COMPLETED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              COMPLETED
                            </span>
                          ) : (
                            <span
                              title={t.reversalReason || 'Reversed'}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700"
                            >
                              <RotateCcw className="w-3 h-3" />
                              REVERSED
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View Mode 2: Monthly Summary Breakdown */}
      {activeView === 'monthly' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-900">Monthly Cashflow Breakdown</h2>
            <p className="text-xs text-slate-500">
              Aggregated monthly collections with Cash vs UPI splits
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Billing Month</th>
                  <th className="py-3 px-4 text-center">Transactions</th>
                  <th className="py-3 px-4 text-right">Cash Collection</th>
                  <th className="py-3 px-4 text-right">UPI Collection</th>
                  <th className="py-3 px-4 text-right">Total Collection</th>
                  <th className="py-3 px-4 text-center">Cash % vs UPI %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summaries.monthly.map((m) => {
                  const cashPct = Math.round((m.cash / (m.total || 1)) * 100);
                  const upiPct = 100 - cashPct;
                  return (
                    <tr key={m.month} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                        {m.month}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-700">
                        {m.count}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-700">
                        {formatCurrency(m.cash)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-purple-700">
                        {formatCurrency(m.upi)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                        {formatCurrency(m.total)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-[11px] font-semibold">
                          <span className="text-emerald-700">{cashPct}% Cash</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-purple-700">{upiPct}% UPI</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
