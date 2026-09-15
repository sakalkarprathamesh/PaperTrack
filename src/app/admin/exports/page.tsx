'use client';

import React, { useState } from 'react';
import {
  Download,
  ShieldAlert,
  Database,
  Users,
  Newspaper,
  Truck,
  Receipt,
  CreditCard,
  BarChart3,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { exportToCSV } from '@/lib/export-csv';

export default function DataExportsPage() {
  // Delivery date range
  const [deliveryStart, setDeliveryStart] = useState<string>('2026-08-01');
  const [deliveryEnd, setDeliveryEnd] = useState<string>(new Date().toISOString().split('T')[0]);

  // Payments date range
  const [paymentStart, setPaymentStart] = useState<string>('2026-08-01');
  const [paymentEnd, setPaymentEnd] = useState<string>(new Date().toISOString().split('T')[0]);

  // Bills month filter
  const [billMonth, setBillMonth] = useState<string>('ALL');

  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const notifySuccess = (name: string) => {
    setDownloadSuccess(name);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // 1. Export Customers
  const handleExportCustomers = () => {
    const customers = dataService.getCustomers();
    const rows = customers.map((c) => ({
      customer_id: c.id,
      name: c.name,
      phone: c.phone,
      address: c.address,
      area: c.area,
      delivery_staff: c.delivery_boy?.name || 'Unassigned',
      status: c.status,
      start_date: c.start_date,
      advance_balance: (c.advance_balance || 0).toFixed(2),
      current_outstanding: (c.current_balance || 0).toFixed(2),
      created_at: c.created_at || '',
    }));

    exportToCSV(`PaperTrack_Customers_Master_${new Date().toISOString().split('T')[0]}`, rows, [
      { key: 'customer_id', label: 'Customer ID' },
      { key: 'name', label: 'Customer Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'address', label: 'Address' },
      { key: 'area', label: 'Area' },
      { key: 'delivery_staff', label: 'Delivery Staff' },
      { key: 'status', label: 'Status' },
      { key: 'start_date', label: 'Start Date' },
      { key: 'advance_balance', label: 'Advance Balance (₹)' },
      { key: 'current_outstanding', label: 'Current Due (₹)' },
      { key: 'created_at', label: 'Created At' },
    ]);
    notifySuccess('Customers Master List');
  };

  // 2. Export Subscriptions
  const handleExportSubscriptions = () => {
    const subs = dataService.subscriptions;
    const customers = dataService.getCustomers();
    const rows = subs.map((s) => {
      const cust = customers.find((c) => c.id === s.customer_id);
      return {
        subscription_id: s.id,
        customer_name: cust?.name || 'Customer',
        customer_phone: cust?.phone || '',
        customer_area: cust?.area || '',
        daily_rate: s.daily_rate.toFixed(2),
        start_date: s.start_date,
        status: s.status,
      };
    });

    exportToCSV(`PaperTrack_Subscriptions_${new Date().toISOString().split('T')[0]}`, rows, [
      { key: 'subscription_id', label: 'Subscription ID' },
      { key: 'customer_name', label: 'Customer Name' },
      { key: 'customer_phone', label: 'Phone' },
      { key: 'customer_area', label: 'Area' },
      { key: 'daily_rate', label: 'Daily Rate (₹)' },
      { key: 'start_date', label: 'Start Date' },
      { key: 'status', label: 'Subscription Status' },
    ]);
    notifySuccess('Active Subscriptions Register');
  };

  // 3. Export Delivery Records
  const handleExportDeliveries = () => {
    let records = dataService.deliveryRecords;
    if (deliveryStart) records = records.filter((r) => r.delivery_date >= deliveryStart);
    if (deliveryEnd) records = records.filter((r) => r.delivery_date <= deliveryEnd);

    const customers = dataService.getCustomers();
    const rows = records.map((r) => {
      const cust = customers.find((c) => c.id === r.customer_id);
      return {
        date: r.delivery_date,
        customer_name: cust?.name || 'Customer',
        area: cust?.area || '',
        status: r.status,
        marked_at: r.marked_at || '',
        notes: r.notes || '',
      };
    });

    exportToCSV(`PaperTrack_DeliveryRecords_${deliveryStart}_to_${deliveryEnd}`, rows, [
      { key: 'date', label: 'Delivery Date' },
      { key: 'customer_name', label: 'Customer Name' },
      { key: 'area', label: 'Area' },
      { key: 'status', label: 'Delivery Status' },
      { key: 'marked_at', label: 'Marked At' },
      { key: 'notes', label: 'Notes' },
    ]);
    notifySuccess('Delivery Records');
  };

  // 4. Export Monthly Bills
  const handleExportBills = () => {
    let bills = dataService.bills;
    if (billMonth && billMonth !== 'ALL') {
      bills = bills.filter((b) => b.billing_month === billMonth);
    }

    const customers = dataService.getCustomers();
    const rows = bills.map((b) => {
      const cust = customers.find((c) => c.id === b.customer_id);
      return {
        bill_id: b.id,
        billing_month: b.billing_month,
        customer_name: cust?.name || 'Customer',
        customer_phone: cust?.phone || '',
        previous_balance: b.previous_balance.toFixed(2),
        current_charges: b.current_charges.toFixed(2),
        total_due: b.total_due.toFixed(2),
        paid_amount: b.paid_amount.toFixed(2),
        remaining_amount: b.remaining_amount.toFixed(2),
        status: b.status,
        generated_at: b.generated_at,
      };
    });

    exportToCSV(`PaperTrack_Bills_${billMonth}`, rows, [
      { key: 'bill_id', label: 'Bill ID' },
      { key: 'billing_month', label: 'Billing Month' },
      { key: 'customer_name', label: 'Customer Name' },
      { key: 'customer_phone', label: 'Phone' },
      { key: 'previous_balance', label: 'Previous Balance (₹)' },
      { key: 'current_charges', label: 'Current Charges (₹)' },
      { key: 'total_due', label: 'Total Due (₹)' },
      { key: 'paid_amount', label: 'Paid Amount (₹)' },
      { key: 'remaining_amount', label: 'Remaining (₹)' },
      { key: 'status', label: 'Status' },
      { key: 'generated_at', label: 'Generated At' },
    ]);
    notifySuccess('Bills Register');
  };

  // 5. Export Payments
  const handleExportPayments = () => {
    let payments = dataService.payments;
    if (paymentStart) payments = payments.filter((p) => p.payment_date >= paymentStart);
    if (paymentEnd) payments = payments.filter((p) => p.payment_date <= paymentEnd);

    const customers = dataService.getCustomers();
    const rows = payments.map((p) => {
      const cust = customers.find((c) => c.id === p.customer_id);
      return {
        receipt_number: p.receipt_number,
        payment_date: p.payment_date,
        customer_name: cust?.name || 'Customer',
        amount: p.amount.toFixed(2),
        payment_mode: p.payment_mode,
        upi_reference: p.upi_reference || '',
        recorded_by: p.recorded_by || 'Admin',
        status: p.is_reversed ? 'REVERSED' : 'ACTIVE',
        reversal_reason: p.reversal_reason || '',
      };
    });

    exportToCSV(`PaperTrack_Payments_${paymentStart}_to_${paymentEnd}`, rows, [
      { key: 'receipt_number', label: 'Receipt #' },
      { key: 'payment_date', label: 'Payment Date' },
      { key: 'customer_name', label: 'Customer Name' },
      { key: 'amount', label: 'Amount (₹)' },
      { key: 'payment_mode', label: 'Mode' },
      { key: 'upi_reference', label: 'UPI Reference' },
      { key: 'recorded_by', label: 'Recorded By' },
      { key: 'status', label: 'Status' },
      { key: 'reversal_reason', label: 'Reversal Reason' },
    ]);
    notifySuccess('Payments Register');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            Data Portability & Backup
          </span>
          <span className="text-xs text-slate-500">Spreadsheet Ready (CSV)</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
          Agency Data Export & Backup Center
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Generate structured CSV exports for offline spreadsheet auditing, archival backups, and tax accounting.
        </p>
      </div>

      {/* Sensitive Data Privacy Warning Alert */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-start gap-3 shadow-xs">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 space-y-1">
          <p className="font-bold text-sm text-amber-950">
            Privacy & Security Warning:
          </p>
          <p>
            Downloaded export files contain sensitive customer contact details (phone numbers, home addresses) and private agency financial transaction records.
          </p>
          <p className="font-semibold text-amber-800">
            Store downloaded files securely. Do not share raw customer databases with unauthorized individuals.
          </p>
        </div>
      </div>

      {/* Success Notification Banner */}
      {downloadSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Successfully generated and downloaded {downloadSuccess}!</span>
        </div>
      )}

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Customers Master */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 text-red-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Customer Master Register</h2>
                <span className="text-[11px] text-slate-500">Contact, area, route & balances</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-3">
              Complete customer directory including phone numbers, physical addresses, assigned delivery staff, advance credits, and current pending balances.
            </p>
          </div>
          <button
            onClick={handleExportCustomers}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Customers CSV</span>
          </button>
        </div>

        {/* 2. Subscriptions */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <Newspaper className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Subscriptions Register</h2>
                <span className="text-[11px] text-slate-500">Active newspaper plans</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-3">
              Active Lokmat newspaper subscriptions linked with custom daily rates (₹5/day default), start dates, and operational status.
            </p>
          </div>
          <button
            onClick={handleExportSubscriptions}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Subscriptions CSV</span>
          </button>
        </div>

        {/* 3. Monthly Bills */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Monthly Bills Register</h2>
                <span className="text-[11px] text-slate-500">Itemized billing history</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-3">
              Charges, carry-forward balances, paid amounts, remaining dues, and clearance statuses.
            </p>
            <div className="mt-3">
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Billing Month:</label>
              <select
                value={billMonth}
                onChange={(e) => setBillMonth(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-red-600 bg-white"
              >
                <option value="ALL">All Billing Months</option>
                <option value="2026-08">August 2026</option>
                <option value="2026-07">July 2026</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleExportBills}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Bills CSV</span>
          </button>
        </div>

        {/* 4. Payments Register */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Payments & Receipts Register</h2>
                <span className="text-[11px] text-slate-500">Cash & UPI ledger</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-3">
              Detailed payment collections with unique receipt numbers, modes, UPI transaction IDs, and reversal tracking.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div>
                <label className="text-[10px] text-slate-500 block">From Date:</label>
                <input
                  type="date"
                  value={paymentStart}
                  onChange={(e) => setPaymentStart(e.target.value)}
                  className="w-full text-[11px] border border-slate-300 rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">To Date:</label>
                <input
                  type="date"
                  value={paymentEnd}
                  onChange={(e) => setPaymentEnd(e.target.value)}
                  className="w-full text-[11px] border border-slate-300 rounded px-2 py-1"
                />
              </div>
            </div>
          </div>
          <button
            onClick={handleExportPayments}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Payments CSV</span>
          </button>
        </div>

        {/* 5. Delivery Records */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Delivery Attendance Register</h2>
                <span className="text-[11px] text-slate-500">Daily delivered / paused days</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-3">
              Auditable daily delivery checklist records (Delivered, Not Delivered, Vacation Paused) that form the basis for monthly ₹5 rate billing.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div>
                <label className="text-[10px] text-slate-500 block">From Date:</label>
                <input
                  type="date"
                  value={deliveryStart}
                  onChange={(e) => setDeliveryStart(e.target.value)}
                  className="w-full text-[11px] border border-slate-300 rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">To Date:</label>
                <input
                  type="date"
                  value={deliveryEnd}
                  onChange={(e) => setDeliveryEnd(e.target.value)}
                  className="w-full text-[11px] border border-slate-300 rounded px-2 py-1"
                />
              </div>
            </div>
          </div>
          <button
            onClick={handleExportDeliveries}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Deliveries CSV</span>
          </button>
        </div>

        {/* 6. Complete Agency Backup */}
        <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Full Snapshot Backup</h2>
                <span className="text-[11px] text-slate-400">Complete customer & financial data</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-3">
              Trigger instant sequential export of all core registers to safeguard your agency data offline in CSV format.
            </p>
          </div>
          <button
            onClick={() => {
              handleExportCustomers();
              setTimeout(handleExportBills, 400);
              setTimeout(handleExportPayments, 800);
            }}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Download Complete Backup Set</span>
          </button>
        </div>
      </div>
    </div>
  );
}
