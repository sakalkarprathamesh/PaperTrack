'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  IndianRupee,
  CreditCard,
  Truck,
  Users,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportToCSV } from '@/lib/export-csv';

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    const s = dataService.getAdminDashboardStats();
    const c = dataService.getCustomers();
    setStats(s);
    setCustomers(c);
  }, []);

  if (!stats) return <div className="p-8 text-slate-500">Loading reports...</div>;

  const handleExportLedger = () => {
    const rows = customers.map((c) => ({
      ID: c.id,
      CustomerName: c.name,
      Mobile: c.phone,
      Area: c.area,
      DeliveryBoy: c.delivery_boy?.name || 'Unassigned',
      TotalBalanceDue: c.current_balance || 0,
      AdvanceCredit: c.advance_balance || 0,
      Status: (c.current_balance || 0) <= 0 ? 'CLEARED' : 'PENDING',
    }));
    exportToCSV('papertrack-balance-ledger', rows);
  };

  const pendingList = customers.filter((c) => (c.current_balance || 0) > 0);
  const clearedList = customers.filter((c) => (c.current_balance || 0) <= 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Agency Reports & Balance Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit monthly revenue, outstanding balances, cash vs UPI splits, and customer clearances.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportLedger}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Balance Ledger CSV</span>
          </button>
        </div>
      </div>

      {/* Revenue Split Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print-card">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400">Total Collections (This Month)</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(stats.totalCollection)}</p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Cash: <strong className="text-emerald-700">{formatCurrency(stats.cashCollection)}</strong></span>
            <span>UPI: <strong className="text-purple-700">{formatCurrency(stats.upiCollection)}</strong></span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400">Total Unpaid Balance</span>
          <p className="text-2xl font-black text-amber-800 mt-1">{formatCurrency(stats.totalOutstanding)}</p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            Across {pendingList.length} subscribers with carry-forward balance
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400">Customer Clearance Rate</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {Math.round((clearedList.length / (customers.length || 1)) * 100)}%
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>Cleared: <strong className="text-emerald-700">{clearedList.length}</strong></span>
            <span>Pending: <strong className="text-amber-800">{pendingList.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Outstanding Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden print-card">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Outstanding Balances Ledger</h2>
            <p className="text-xs text-slate-500">Subscribers with pending carry-forward balances</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
            {pendingList.length} Pending Accounts
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-4">Customer</th>
              <th className="py-2.5 px-4">Area</th>
              <th className="py-2.5 px-4">Delivery Staff</th>
              <th className="py-2.5 px-4 text-right">Advance Credit</th>
              <th className="py-2.5 px-4 text-right">Total Outstanding Balance</th>
              <th className="py-2.5 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pendingList.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-bold text-slate-900">
                  {c.name}
                  <span className="block text-[11px] font-normal text-slate-500">{c.phone}</span>
                </td>
                <td className="py-3 px-4 text-slate-700">{c.area}</td>
                <td className="py-3 px-4 text-slate-700">{c.delivery_boy?.name || 'Unassigned'}</td>
                <td className="py-3 px-4 text-right text-emerald-700 font-medium">
                  {c.advance_balance > 0 ? formatCurrency(c.advance_balance) : '—'}
                </td>
                <td className="py-3 px-4 text-right font-black text-amber-800">
                  {formatCurrency(c.current_balance)}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    <span>Pending Due</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
