'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Search,
  Users,
  CreditCard,
  Receipt,
  FileText,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { dataService } from '@/lib/data-service';
import { GlobalSearchResult } from '@/lib/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from '@/lib/i18n';

export function AdminTopbar() {
  const { user, switchDemoUser } = useAuth();
  const { t, formatLocaleDate } = useTranslation();
  const router = useRouter();
  const today = new Date();
  const showDemoSwitcher = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ENABLE_DEMO_SWITCHER === 'true';

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalSearchResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Pressing / or Cmd+K / Ctrl+K opens search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults(null);
      setIsOpen(false);
      return;
    }

    const results = dataService.searchGlobal(q);
    setSearchResults(results);
    setIsOpen(true);
  };

  const handleSelectCustomer = (id: string) => {
    setIsOpen(false);
    setSearchQuery('');
    router.push(`/admin/customers/${id}`);
  };

  const handleSelectReceipt = () => {
    setIsOpen(false);
    setSearchQuery('');
    router.push('/admin/payments');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 gap-4 relative z-30">
      {/* Left: Global Search Input */}
      <div className="relative flex-1 max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search customer, phone, area or receipt #... (/ or ⌘K)"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim()) setIsOpen(true);
            }}
            className="w-full pl-9 pr-8 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg text-xs transition-colors focus:outline-hidden focus:border-red-600 shadow-2xs"
          />
          {searchQuery ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults(null);
                setIsOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded">
              ⌘K
            </kbd>
          )}
        </div>

        {/* Global Search Dropdown */}
        {isOpen && searchResults && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-[80vh] overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100"
          >
            {/* Customers Section */}
            <div className="p-3">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  Matching Customers ({searchResults.customers.length})
                </span>
                <span className="text-[10px] lowercase text-slate-400">Jump to profile or ledger</span>
              </div>

              {searchResults.customers.length === 0 ? (
                <p className="text-xs text-slate-400 py-2 px-1 italic">No customers found</p>
              ) : (
                <div className="space-y-1">
                  {searchResults.customers.map((c) => (
                    <div
                      key={c.id}
                      className="p-2 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-3 group transition-colors"
                    >
                      <button
                        onClick={() => handleSelectCustomer(c.id)}
                        className="text-left min-w-0 flex-1"
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-red-700 transition-colors truncate">
                            {c.name}
                          </p>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {c.area}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {c.phone} • Pending Due:{' '}
                          <strong
                            className={c.current_balance > 0 ? 'text-red-700' : 'text-emerald-700'}
                          >
                            {formatCurrency(c.current_balance)}
                          </strong>
                        </p>
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100">
                        <Link
                          href={`/admin/customers/${c.id}/ledger`}
                          onClick={() => setIsOpen(false)}
                          className="px-2 py-1 rounded text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          Ledger
                        </Link>
                        <Link
                          href={`/admin/payments/new?customerId=${c.id}`}
                          onClick={() => setIsOpen(false)}
                          className="px-2 py-1 rounded text-[10px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                        >
                          + Pay
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Receipts Section */}
            <div className="p-3 bg-slate-50/50">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                <span className="flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-slate-500" />
                  Matching Receipts ({searchResults.receipts.length})
                </span>
                <span className="text-[10px] lowercase text-slate-400">Payment records</span>
              </div>

              {searchResults.receipts.length === 0 ? (
                <p className="text-xs text-slate-400 py-2 px-1 italic">No payment receipts found</p>
              ) : (
                <div className="space-y-1">
                  {searchResults.receipts.map((r) => (
                    <div
                      key={r.id}
                      onClick={handleSelectReceipt}
                      className="p-2 rounded-lg hover:bg-white flex items-center justify-between gap-3 cursor-pointer transition-colors border border-transparent hover:border-slate-200"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800">
                            {r.receiptNumber}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-semibold">
                            {r.mode}
                          </span>
                          {r.isReversed && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-100 text-red-700 font-bold">
                              REVERSED
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {r.customerName} • {formatDate(r.date)}
                        </p>
                      </div>

                      <span className="font-mono font-bold text-xs text-slate-900">
                        {formatCurrency(r.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right: Date info & Role Switcher */}
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{formatDate(today)}</span>
          <span className="text-slate-300">|</span>
          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold">
            Lokmat Rate: ₹5.00/day
          </span>
        </div>

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Quick Role Switcher for instant local testing (hidden in production by default) */}
        {showDemoSwitcher && (
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500 px-2 font-medium hidden sm:inline">{t('nav.viewAs')}</span>
            <button
              onClick={() => {
                switchDemoUser('admin');
                router.push('/admin/dashboard');
              }}
              className="px-2.5 py-1 rounded bg-red-700 text-white font-semibold text-xs shadow-xs"
            >
              Admin
            </button>
            <button
              onClick={() => {
                switchDemoUser('delivery');
                router.push('/delivery/today');
              }}
              className="px-2.5 py-1 rounded hover:bg-white text-slate-700 font-medium text-xs transition-colors"
            >
              Delivery Staff
            </button>
            <button
              onClick={() => {
                switchDemoUser('customer');
                router.push('/customer/dashboard');
              }}
              className="px-2.5 py-1 rounded hover:bg-white text-slate-700 font-medium text-xs transition-colors"
            >
              Customer
            </button>
          </div>
        )}

        {/* User badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-red-100 text-red-800 flex items-center justify-center font-bold text-xs">
            A
          </div>
          <div className="text-left hidden md:block">
            <p className="text-xs font-semibold text-slate-800">{user?.fullName || 'Admin'}</p>
            <p className="text-[10px] font-medium text-red-700 uppercase">Agency Owner</p>
          </div>
        </div>
      </div>
    </header>
  );
}
