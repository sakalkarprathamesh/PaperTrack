'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  PauseCircle,
  MapPin,
  Search,
  Phone,
  Truck,
  CheckCheck,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { useAuth } from '@/lib/auth-context';
import { DeliveryStatus } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function DeliveryTodayPage() {
  const { user } = useAuth();
  const deliveryBoyId = user?.deliveryBoyId;

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (deliveryBoyId) {
      loadDeliveries();
    } else {
      setItems([]);
    }
  }, [selectedDate, deliveryBoyId]);

  const loadDeliveries = () => {
    if (!deliveryBoyId) return;
    const list = dataService.getDailyDeliveries(selectedDate, deliveryBoyId);
    setItems(list);
  };

  const handleStatus = (customerId: string, status: DeliveryStatus) => {
    dataService.markDelivery({
      customerId,
      deliveryDate: selectedDate,
      status,
      markedBy: user?.id,
    });
    loadDeliveries();
  };

  const handleMarkAllDelivered = () => {
    const uncompletedIds = items.filter((i) => i.status !== 'DELIVERED').map((i) => i.customer.id);
    if (uncompletedIds.length === 0) return;

    dataService.bulkMarkDeliveries({
      customerIds: uncompletedIds,
      deliveryDate: selectedDate,
      status: 'DELIVERED',
      markedBy: user?.id,
    });
    loadDeliveries();
  };

  const deliveredCount = items.filter((i) => i.status === 'DELIVERED').length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((deliveredCount / totalCount) * 100) : 0;

  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.customer.name.toLowerCase().includes(q) ||
      item.customer.address.toLowerCase().includes(q)
    );
  });

  if (!deliveryBoyId) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3 my-8">
        <h2 className="text-base font-bold text-slate-900">No Delivery Route Assigned</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Your delivery staff profile is not currently linked to an active delivery route. Please contact the Agency Admin to assign your customer route.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Route Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2 py-0.5 rounded">
            Morning Distribution Roster
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Today&apos;s Delivery Checklist</h1>
          <p className="text-xs text-slate-500">
            Assigned route: <strong className="text-slate-800">Shivaji Nagar, Sector 1-4</strong>
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent focus:outline-none"
            />
          </div>
          <button
            onClick={handleMarkAllDelivered}
            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors"
          >
            Mark All Done
          </button>
        </div>
      </div>

      {/* Progress Bar Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
        <div className="flex justify-between text-xs font-bold">
          <span className="text-slate-700">Morning Round Progress</span>
          <span className="text-emerald-700">
            {deliveredCount} of {totalCount} Delivered ({progressPercent}%)
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Quick search address or customer name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-xs bg-white rounded-xl border border-slate-200 shadow-xs focus:outline-none focus:border-red-700"
        />
      </div>

      {/* Customer Checklist */}
      <div className="space-y-3">
        {filteredItems.map(({ customer, status, notes }) => (
          <div
            key={customer.id}
            className={`bg-white border rounded-xl p-4 shadow-xs transition-all ${
              status === 'DELIVERED'
                ? 'border-emerald-200 bg-emerald-50/20'
                : status === 'NOT_DELIVERED'
                ? 'border-rose-200 bg-rose-50/20'
                : 'border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{customer.name}</h3>
                <p className="text-xs text-slate-600 flex items-start gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{customer.address}</span>
                </p>
                {customer.notes && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 rounded px-2 py-0.5 mt-2 inline-block">
                    Note: {customer.notes}
                  </p>
                )}
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                {status === 'DELIVERED' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Delivered</span>
                  </span>
                ) : status === 'NOT_DELIVERED' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Not Delivered</span>
                  </span>
                ) : status === 'PAUSED' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    <PauseCircle className="w-3.5 h-3.5" />
                    <span>Paused</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                    Pending
                  </span>
                )}
              </div>
            </div>

            {/* Quick 1-Tap Mobile Buttons */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleStatus(customer.id, 'DELIVERED')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  status === 'DELIVERED'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Delivered</span>
              </button>

              <button
                onClick={() => handleStatus(customer.id, 'NOT_DELIVERED')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  status === 'NOT_DELIVERED'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>Not Delivered</span>
              </button>

              <button
                onClick={() => handleStatus(customer.id, 'PAUSED')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  status === 'PAUSED'
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                <PauseCircle className="w-4 h-4" />
                <span>Paused</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
