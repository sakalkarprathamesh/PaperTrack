'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Printer, CheckCircle2 } from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { useAuth } from '@/lib/auth-context';
import { Payment } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function CustomerPaymentsPage() {
  const { user } = useAuth();
  const customerId = user?.customerId;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  useEffect(() => {
    if (customerId) {
      const list = dataService.getPayments(customerId);
      setPayments(list);
    } else {
      setPayments([]);
    }
  }, [customerId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Payment Receipts</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          History of verified Cash and UPI payments with digital receipt numbers.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {payments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No payments recorded yet for your account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">UPI Reference</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.receipt_number}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(p.payment_date)}</td>
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4 font-mono text-slate-500">{p.upi_reference || '—'}</td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 print-card">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <span className="font-black text-base tracking-tight text-slate-900">PAPERTRACK</span>
                <p className="text-[10px] text-red-700 font-bold uppercase">Official Payment Receipt</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-xs text-slate-800">{selectedReceipt.receipt_number}</span>
                <p className="text-[10px] text-slate-500">{formatDate(selectedReceipt.payment_date)}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Received From:</span>
                <span className="font-bold text-slate-900">{user?.fullName || 'Subscriber'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="font-semibold uppercase text-slate-800">{selectedReceipt.payment_mode}</span>
              </div>
              {selectedReceipt.upi_reference && (
                <div className="flex justify-between">
                  <span className="text-slate-500">UPI Ref:</span>
                  <span className="font-mono text-slate-800">{selectedReceipt.upi_reference}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black">
                <span className="text-slate-900">Amount Received:</span>
                <span className="text-emerald-700">{formatCurrency(selectedReceipt.amount)}</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 flex items-center justify-between no-print">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
