'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Download,
  Printer,
  Receipt,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Filter,
  FileText,
  User,
  RotateCcw,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { Customer, LedgerEntry } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportToCSV } from '@/lib/export-csv';

export default function CustomerLedgerPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [ledgerData, setLedgerData] = useState<{
    openingBalance: number;
    entries: LedgerEntry[];
    runningBalance: number;
    advanceBalance: number;
    currentBalance: number;
    totalBilled: number;
    totalPaid: number;
  } | null>(null);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    loadLedger();
  }, [customerId, startDate, endDate]);

  const loadLedger = () => {
    try {
      const cust = dataService.getCustomerById(customerId);
      if (!cust) return;
      setCustomer(cust);

      const data = dataService.getCustomerLedger(customerId, startDate || undefined, endDate || undefined);
      setLedgerData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCSV = () => {
    if (!ledgerData || !customer) return;

    const rows = ledgerData.entries.map((e) => ({
      date: e.date,
      type: e.type,
      description: e.description,
      debit: e.debit > 0 ? e.debit.toFixed(2) : '',
      credit: e.credit > 0 ? e.credit.toFixed(2) : '',
      running_balance: e.runningBalance.toFixed(2),
      payment_mode: e.paymentMode || '',
      reference: e.reference || '',
      status: e.isReversed ? 'REVERSED' : 'ACTIVE',
      reversal_reason: e.reversalReason || '',
    }));

    exportToCSV(`Ledger_${customer.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`, rows, [
      { key: 'date', label: 'Date' },
      { key: 'type', label: 'Transaction Type' },
      { key: 'description', label: 'Description' },
      { key: 'debit', label: 'Debit (₹)' },
      { key: 'credit', label: 'Credit (₹)' },
      { key: 'running_balance', label: 'Balance (₹)' },
      { key: 'payment_mode', label: 'Payment Mode' },
      { key: 'reference', label: 'Reference / Receipt #' },
      { key: 'status', label: 'Status' },
      { key: 'reversal_reason', label: 'Reversal Reason' },
    ]);
  };

  if (!customer || !ledgerData) {
    return (
      <div className="p-8 text-slate-500">
        Loading customer ledger...{' '}
        <Link href="/admin/customers" className="text-red-700 underline font-semibold">
          Return to directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <Link
            href={`/admin/customers/${customer.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {customer.name}&apos;s Profile</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900">Customer Account Ledger</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {customer.area}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chronological audit of monthly newspaper bills, payments received, reversals, and running dues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/customers/${customer.id}/statement`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Statement View</span>
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Ledger</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <Link
            href={`/admin/payments/new?customerId=${customer.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Collect Payment</span>
          </Link>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Customer Details</span>
            <User className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-lg font-bold text-slate-900 mt-2">{customer.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{customer.phone} • {customer.area}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Advance Credit</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">
            {formatCurrency(ledgerData.advanceBalance)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Prepaid surplus credit</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Period Debits / Credits</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-red-600">Billed:</span>
              <p className="text-sm font-bold text-slate-900">{formatCurrency(ledgerData.totalBilled)}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-600">Paid:</span>
              <p className="text-sm font-bold text-slate-900">{formatCurrency(ledgerData.totalPaid)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Current Outstanding</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <p
            className={`text-2xl font-black mt-2 ${
              ledgerData.currentBalance > 0 ? 'text-red-700' : 'text-emerald-700'
            }`}
          >
            {formatCurrency(ledgerData.currentBalance)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {ledgerData.currentBalance > 0 ? 'Pending collection' : 'Zero balance / Cleared'}
          </p>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Filter Ledger Dates:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-red-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-red-600"
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs font-semibold text-red-700 hover:text-red-800 px-2 py-1"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Transaction History</h2>
            <p className="text-xs text-slate-500">
              {ledgerData.entries.length} recorded entries
              {startDate || endDate ? ` (Filtered: ${startDate || 'Start'} to ${endDate || 'Latest'})` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 text-red-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-600"></span> Debit = Bill Charges
            </span>
            <span className="text-slate-300">|</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Credit = Payment Received
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Ref / Mode</th>
                <th className="py-3 px-4 text-right">Debit (Bill)</th>
                <th className="py-3 px-4 text-right">Credit (Payment)</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
                <th className="py-3 px-4 text-center no-print">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ledgerData.entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No transactions recorded for this customer in the selected date range.
                  </td>
                </tr>
              ) : (
                ledgerData.entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      entry.isReversed ? 'bg-red-50/30 line-through text-slate-400' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {formatDate(entry.date)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {entry.type === 'BILL' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                          <Receipt className="w-3 h-3" />
                          BILL
                        </span>
                      ) : entry.type === 'PAYMENT' ? (
                        entry.isReversed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                            <RotateCcw className="w-3 h-3 text-red-500" />
                            REVERSED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CreditCard className="w-3 h-3" />
                            PAYMENT
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          OPENING
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-medium ${entry.isReversed ? 'text-slate-400' : 'text-slate-800'}`}>
                        {entry.description}
                      </span>
                      {entry.isReversed && entry.reversalReason && (
                        <span className="block text-[11px] text-red-600 font-normal no-underline mt-0.5">
                          Reason: {entry.reversalReason}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      {entry.reference && <span className="font-mono">{entry.reference}</span>}
                      {entry.paymentMode && (
                        <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                          {entry.paymentMode}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-red-700 whitespace-nowrap">
                      {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700 whitespace-nowrap">
                      {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(entry.runningBalance)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap no-print">
                      {entry.billId ? (
                        <Link
                          href={`/admin/billing/${entry.billId}`}
                          className="text-xs font-semibold text-red-700 hover:underline"
                        >
                          View Bill
                        </Link>
                      ) : entry.paymentId ? (
                        <Link
                          href={`/admin/payments`}
                          className="text-xs font-semibold text-emerald-700 hover:underline"
                        >
                          View Receipt
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-900">
                <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                  Net Outstanding Balance:
                </td>
                <td className="py-3 px-4 text-right font-mono text-red-700 text-xs">
                  {formatCurrency(ledgerData.totalBilled)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-700 text-xs">
                  {formatCurrency(ledgerData.totalPaid)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-sm">
                  {formatCurrency(ledgerData.runningBalance)}
                </td>
                <td className="no-print"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
