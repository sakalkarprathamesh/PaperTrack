'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Truck,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Receipt,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Calendar,
  UploadCloud,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const data = dataService.getAdminDashboardStats();
    setStats(data);
    const alertList = dataService.getAdminAlerts();
    setAlerts(alertList);
  }, []);

  if (!stats) return <div className="p-8 text-slate-500">Loading Dashboard...</div>;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
              Agency Overview
            </span>
            <span className="text-xs text-slate-500">Lokmat Daily Route & Accounts</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Newspaper Distribution & Billing Desk
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor daily morning delivery progress, monthly bill statuses, and cash/UPI collections.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/delivery"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <Truck className="w-4 h-4" />
            <span>Today's Deliveries</span>
          </Link>
          <Link
            href="/admin/payments/new"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <CreditCard className="w-4 h-4" />
            <span>Record Payment</span>
          </Link>
          <Link
            href="/admin/reminders"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
          >
            <span>Reminders</span>
          </Link>
          <Link
            href="/admin/billing"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
          >
            <Receipt className="w-4 h-4" />
            <span>Monthly Bills</span>
          </Link>
          <Link
            href="/admin/customers/new"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Customer</span>
          </Link>
        </div>
      </div>

      {/* Feature 10: Actionable Admin Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Action Required ({alerts.length} Pending Attention)</span>
            </h2>
            <span className="text-[11px] text-slate-400">Live operational alerts</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-xl p-4 border shadow-2xs flex items-center justify-between gap-4 transition-all ${
                  alert.type === 'CRITICAL'
                    ? 'bg-red-50/70 border-red-200 text-red-950'
                    : alert.type === 'WARNING'
                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                    : 'bg-blue-50/70 border-blue-200 text-blue-950'
                }`}
              >
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        alert.type === 'CRITICAL'
                          ? 'bg-red-200 text-red-800'
                          : alert.type === 'WARNING'
                          ? 'bg-amber-200 text-amber-800'
                          : 'bg-blue-200 text-blue-800'
                      }`}
                    >
                      {alert.count} ITEMS
                    </span>
                    <h3 className="text-xs font-bold truncate">{alert.title}</h3>
                  </div>
                  <p className="text-xs opacity-80">{alert.description}</p>
                </div>

                <Link
                  href={alert.actionHref}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors shadow-2xs ${
                    alert.type === 'CRITICAL'
                      ? 'bg-red-700 hover:bg-red-800 text-white'
                      : alert.type === 'WARNING'
                      ? 'bg-amber-700 hover:bg-amber-800 text-white'
                      : 'bg-blue-700 hover:bg-blue-800 text-white'
                  }`}
                >
                  <span>{alert.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Customers"
          value={stats.activeCustomers}
          subtext="Subscribed to Lokmat @ ₹5/day"
          icon={Users}
          variant="brand"
        />
        <StatCard
          title="Today's Deliveries"
          value={`${stats.todayDelivered} / ${stats.todayTotalActive}`}
          subtext={`${Math.round((stats.todayDelivered / (stats.todayTotalActive || 1)) * 100)}% route delivered today`}
          icon={Truck}
          variant="success"
        />
        <StatCard
          title="Current Month Collection"
          value={formatCurrency(stats.totalCollection)}
          subtext={`Cash: ${formatCurrency(stats.cashCollection)} | UPI: ${formatCurrency(stats.upiCollection)}`}
          icon={IndianRupee}
          variant="default"
        />
        <StatCard
          title="Total Outstanding"
          value={formatCurrency(stats.totalOutstanding)}
          subtext={`${stats.pendingCustomers} customers with pending balance`}
          icon={Clock}
          variant="warning"
        />
      </div>

      {/* Customer Health Split Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cleared vs Pending Balance Split */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Customer Account Status</h2>
              <span className="text-xs text-slate-500 font-medium">Diary Balance Sync</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Customers categorized by cleared zero balance vs carry-forward pending dues.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">Cleared</span>
                </div>
                <p className="text-2xl font-bold text-emerald-900 mt-2">{stats.clearedCustomers}</p>
                <p className="text-xs text-emerald-700 mt-1">Zero pending balance</p>
              </div>

              <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">Pending</span>
                </div>
                <p className="text-2xl font-bold text-amber-900 mt-2">{stats.pendingCustomers}</p>
                <p className="text-xs text-amber-700 mt-1">Outstanding dues</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Need to digitize handwritten physical diary?</span>
            <Link
              href="/admin/import"
              className="text-red-700 font-semibold hover:underline flex items-center gap-1"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Assisted CSV Import</span>
            </Link>
          </div>
        </div>

        {/* Recent Payments Ledger */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Recent Payment Collections</h2>
                <p className="text-xs text-slate-500 mt-0.5">Real-time payments received via Cash or UPI</p>
              </div>
              <Link
                href="/admin/payments"
                className="text-xs font-semibold text-red-700 hover:text-red-800 flex items-center gap-1"
              >
                <span>View Full Register</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="pb-2.5">Receipt #</th>
                    <th className="pb-2.5">Customer</th>
                    <th className="pb-2.5">Date</th>
                    <th className="pb-2.5">Mode</th>
                    <th className="pb-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.recentPayments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 font-mono font-medium text-slate-700">{p.receipt_number}</td>
                      <td className="py-3 font-semibold text-slate-900">{p.customer?.name || 'Customer'}</td>
                      <td className="py-3 text-slate-500">{formatDate(p.payment_date)}</td>
                      <td className="py-3">
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
                      <td className="py-3 text-right font-bold text-slate-900">{formatCurrency(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Payment receipts are permanently stored and support audited reversals.</span>
            <Link href="/admin/payments/new" className="font-semibold text-emerald-700 hover:underline">
              + Collect New Payment
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
