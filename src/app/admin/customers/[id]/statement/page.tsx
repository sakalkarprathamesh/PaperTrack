'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Printer,
  FileText,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Truck,
  Newspaper,
  CreditCard,
  Download,
  Share2,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportToCSV } from '@/lib/export-csv';

export default function CustomerStatementPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [statement, setStatement] = useState<any>(null);
  const [startDate, setStartDate] = useState<string>('2026-08-01');
  const [endDate, setEndDate] = useState<string>('2026-09-30');

  useEffect(() => {
    loadStatement();
  }, [customerId, startDate, endDate]);

  const loadStatement = () => {
    try {
      const data = dataService.getCustomerStatement(customerId, startDate || undefined, endDate || undefined);
      setStatement(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!statement) return;
    const rows = [
      ...statement.bills.map((b: any) => ({
        date: b.generated_at ? b.generated_at.split('T')[0] : `${b.billing_month}-01`,
        type: 'BILL',
        description: `Lokmat Bill - ${b.billing_month}`,
        debit: b.current_charges,
        credit: 0,
        reference: b.billing_month,
      })),
      ...statement.payments.map((p: any) => ({
        date: p.payment_date,
        type: 'PAYMENT',
        description: `Payment Received (${p.payment_mode})`,
        debit: 0,
        credit: p.is_reversed ? 0 : p.amount,
        reference: p.receipt_number,
      })),
    ];

    exportToCSV(`Statement_${statement.customer.name.replace(/\s+/g, '_')}`, rows, [
      { key: 'date', label: 'Date' },
      { key: 'type', label: 'Type' },
      { key: 'description', label: 'Description' },
      { key: 'debit', label: 'Debit (₹)' },
      { key: 'credit', label: 'Credit (₹)' },
      { key: 'reference', label: 'Reference' },
    ]);
  };

  if (!statement) {
    return (
      <div className="p-8 text-slate-500">
        Loading customer statement...{' '}
        <Link href="/admin/customers" className="text-red-700 underline font-semibold">
          Return to directory
        </Link>
      </div>
    );
  }

  const { customer, agency } = statement;

  return (
    <div className="space-y-6">
      {/* Control Bar (hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <Link
          href={`/admin/customers/${customer.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {customer.name}&apos;s Profile</span>
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-red-600"
            />
            <span className="text-slate-500">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-red-600"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Statement</span>
          </button>
        </div>
      </div>

      {/* Printable Statement Sheet */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-sm print-card max-w-4xl mx-auto space-y-8 text-slate-800 font-sans">
        {/* Statement Header */}
        <div className="border-b-2 border-red-700 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-red-700">
                <Newspaper className="w-7 h-7" />
                <span className="text-2xl font-black tracking-tight">{agency.agency_name}</span>
              </div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mt-1">
                Authorized Lokmat Newspaper Distribution Agency
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {agency.agency_address} • Phone: <strong>{agency.agency_phone}</strong>
              </p>
              <p className="text-xs text-slate-500">
                UPI ID for Payment: <strong className="font-mono text-slate-800">{agency.upi_id || 'papertrack@upi'}</strong>
              </p>
            </div>

            <div className="sm:text-right">
              <span className="inline-block px-3 py-1 rounded bg-slate-100 text-slate-800 font-mono font-bold text-xs">
                ACCOUNT STATEMENT
              </span>
              <p className="text-xs text-slate-500 mt-2">
                Statement Period:
              </p>
              <p className="text-xs font-bold text-slate-800 font-mono">
                {formatDate(startDate)} to {formatDate(endDate)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Generated on {formatDate(new Date())}
              </p>
            </div>
          </div>
        </div>

        {/* Customer & Route Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Customer Information
            </span>
            <p className="text-base font-black text-slate-900 mt-1">{customer.name}</p>
            <p className="text-slate-600 mt-0.5">{customer.address}</p>
            <p className="text-slate-600">Area: <strong>{customer.area}</strong></p>
            <p className="text-slate-600">Contact: <strong>{customer.phone}</strong></p>
          </div>

          <div className="sm:text-right space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Subscription & Delivery
            </span>
            <p className="font-semibold text-slate-800">Publication: Lokmat Marathi Daily</p>
            <p className="text-slate-600">Daily Newspaper Rate: <strong>₹5.00 / day</strong></p>
            <p className="text-slate-600">
              Delivery Staff: <strong>{customer.delivery_boy?.name || 'Assigned Route Staff'}</strong>
            </p>
            <p className="text-slate-600">
              Delivery Route: <strong>{customer.area}</strong>
            </p>
          </div>
        </div>

        {/* Financial Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Opening Balance</span>
            <p className="text-lg font-black text-slate-900 mt-1">{formatCurrency(statement.openingBalance)}</p>
            <span className="text-[10px] text-slate-500">Prior to {formatDate(startDate)}</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Billed</span>
            <p className="text-lg font-black text-red-700 mt-1">{formatCurrency(statement.totalBilledInRange)}</p>
            <span className="text-[10px] text-slate-500">{statement.bills.length} bills generated</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Paid</span>
            <p className="text-lg font-black text-emerald-700 mt-1">{formatCurrency(statement.totalPaidInRange)}</p>
            <span className="text-[10px] text-slate-500">{statement.payments.length} payments received</span>
          </div>

          <div className="p-4 rounded-xl border-2 border-red-600 bg-red-50/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">Closing Balance</span>
            <p className="text-xl font-black text-red-800 mt-1">{formatCurrency(statement.closingBalance)}</p>
            <span className="text-[10px] text-red-600 font-semibold">
              {statement.closingBalance > 0 ? 'Amount Payable' : 'Zero Balance'}
            </span>
          </div>
        </div>

        {/* Delivery Activity In Range */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-slate-500" />
            <span>Delivery Attendance Summary (During Selected Period)</span>
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="text-emerald-700 font-semibold">Delivered Days</span>
              <p className="text-2xl font-black text-emerald-800 mt-1">{statement.deliveredCount}</p>
              <span className="text-[10px] text-emerald-600">Billed @ ₹5/day</span>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <span className="text-amber-700 font-semibold">Vacation Holds / Paused</span>
              <p className="text-2xl font-black text-amber-800 mt-1">{statement.pausedCount}</p>
              <span className="text-[10px] text-amber-600">₹0 charged (Unbilled)</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-600 font-semibold">Missed / Not Delivered</span>
              <p className="text-2xl font-black text-slate-800 mt-1">{statement.notDeliveredCount}</p>
              <span className="text-[10px] text-slate-500">₹0 charged (Unbilled)</span>
            </div>
          </div>
        </div>

        {/* Itemized Bills Table */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Bills Generated In Period</span>
          </h3>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Billing Month</th>
                  <th className="py-2.5 px-3 text-right">Previous Bal</th>
                  <th className="py-2.5 px-3 text-right">Current Charges</th>
                  <th className="py-2.5 px-3 text-right">Total Due</th>
                  <th className="py-2.5 px-3 text-right">Paid</th>
                  <th className="py-2.5 px-3 text-right">Remaining</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statement.bills.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-slate-400">
                      No bills generated within this period.
                    </td>
                  </tr>
                ) : (
                  statement.bills.map((b: any) => (
                    <tr key={b.id}>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{b.billing_month}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {formatCurrency(b.previous_balance)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                        {formatCurrency(b.current_charges)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(b.total_due)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                        {formatCurrency(b.paid_amount)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-red-700">
                        {formatCurrency(b.remaining_amount)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.status === 'CLEARED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payments Received In Period */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-slate-500" />
            <span>Payments & Collections In Period</span>
          </h3>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Receipt #</th>
                  <th className="py-2.5 px-3">Payment Mode</th>
                  <th className="py-2.5 px-3">UPI Ref / Notes</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statement.payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-400">
                      No payments received within this period.
                    </td>
                  </tr>
                ) : (
                  statement.payments.map((p: any) => (
                    <tr key={p.id} className={p.is_reversed ? 'bg-red-50/20 line-through text-slate-400' : ''}>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{formatDate(p.payment_date)}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">{p.receipt_number}</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {p.payment_mode}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {p.upi_reference || p.notes || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.is_reversed
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {p.is_reversed ? 'REVERSED' : 'PAID'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Statement Footer */}
        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-700">Payment Instructions:</p>
            <p>Please pay via UPI to <span className="font-mono font-bold text-slate-900">{agency.upi_id || 'papertrack@upi'}</span> or hand cash directly to your daily delivery boy.</p>
          </div>
          <div className="text-center sm:text-right shrink-0">
            <div className="h-10 border-b border-slate-400 w-36 mb-1 mx-auto sm:ml-auto"></div>
            <p className="font-semibold text-slate-700">Authorized Signature</p>
            <p className="text-[10px] text-slate-400">{agency.agency_name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
