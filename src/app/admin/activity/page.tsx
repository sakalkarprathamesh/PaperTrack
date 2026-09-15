'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  Calendar,
  Filter,
  Users,
  CreditCard,
  Receipt,
  RotateCcw,
  PauseCircle,
  FileText,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { AuditLog } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function ActivityTimelinePage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, [selectedAction, startDate, endDate]);

  const loadLogs = () => {
    const list = dataService.getAuditLogs(
      selectedAction === 'ALL' ? undefined : selectedAction,
      startDate || undefined,
      endDate || undefined
    );
    setLogs(list);
  };

  const getActionIcon = (log: AuditLog) => {
    if (log.action.includes('REVERSE')) {
      return <RotateCcw className="w-4 h-4 text-red-600" />;
    }
    if (log.entity_type === 'PAYMENT') {
      return <CreditCard className="w-4 h-4 text-emerald-600" />;
    }
    if (log.entity_type === 'BILL') {
      return <Receipt className="w-4 h-4 text-purple-600" />;
    }
    if (log.entity_type === 'SUBSCRIPTION_PAUSE') {
      return <PauseCircle className="w-4 h-4 text-amber-600" />;
    }
    if (log.entity_type === 'CUSTOMER_NOTE') {
      return <FileText className="w-4 h-4 text-blue-600" />;
    }
    return <Users className="w-4 h-4 text-slate-600" />;
  };

  const getActionBadge = (log: AuditLog) => {
    if (log.action.includes('REVERSE')) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (log.entity_type === 'PAYMENT') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (log.entity_type === 'BILL') {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (log.entity_type === 'SUBSCRIPTION_PAUSE') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (log.entity_type === 'CUSTOMER_NOTE') {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            System Compliance & Audit
          </span>
          <span className="text-xs text-slate-500">Immutable Change History</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
          Activity & Audit Timeline
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Chronological record of financial events, customer updates, payment collections, reversals, and delivery holds.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Filter Activities:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Action Type:</span>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-red-600 bg-white"
            >
              <option value="ALL">All Activities</option>
              <option value="PAYMENT">Payments & Receipts</option>
              <option value="REVERSE">Payment Reversals</option>
              <option value="BILL">Monthly Billing</option>
              <option value="CUSTOMER">Customer Records</option>
              <option value="SUBSCRIPTION_PAUSE">Vacation Holds</option>
              <option value="CUSTOMER_NOTE">Internal Notes</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-red-600"
            />
            <span className="text-xs text-slate-500">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-red-600"
            />
          </div>

          {(selectedAction !== 'ALL' || startDate || endDate) && (
            <button
              onClick={() => {
                setSelectedAction('ALL');
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs font-semibold text-red-700 hover:text-red-800 px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Audit Timeline List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">Audit Log ({logs.length} events)</h2>
          </div>
          <span className="text-xs text-slate-500">Ordered newest first</span>
        </div>

        <div className="divide-y divide-slate-100">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No audit activities match the selected filter criteria.
            </div>
          ) : (
            logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const dateStr = log.created_at.split('T')[0];
              const timeStr = log.created_at.split('T')[1]?.substring(0, 8) || '';

              return (
                <div key={log.id} className="p-4 sm:px-6 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                        {getActionIcon(log)}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadge(
                              log
                            )}`}
                          >
                            {log.action.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs font-semibold text-slate-800">
                            {log.entity_type}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-500">
                            Performed by: <strong className="text-slate-700">{log.performed_by || 'Admin'}</strong>
                          </span>
                        </div>

                        {/* Summary details */}
                        <div className="mt-1 text-xs text-slate-600">
                          {log.details && (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                              {Object.entries(log.details)
                                .slice(0, 4)
                                .map(([k, v]) => (
                                  <span key={k} className="text-slate-600">
                                    <span className="text-slate-400 capitalize">{k}:</span>{' '}
                                    <strong className="text-slate-800">{String(v)}</strong>
                                  </span>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-mono font-medium text-slate-700">{formatDate(dateStr)}</p>
                        <p className="text-[10px] font-mono text-slate-400">{timeStr} UTC</p>
                      </div>

                      {log.details && (
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="View raw metadata"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable JSON Metadata inspector */}
                  {isExpanded && log.details && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg text-[11px] font-mono overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
