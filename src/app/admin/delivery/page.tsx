'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  PauseCircle,
  CheckCheck,
  MapPin,
  User,
  Filter,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { DeliveryStatus, DeliveryBoy } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function DailyDeliveryDeskPage() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [deliveryBoyFilter, setDeliveryBoyFilter] = useState('ALL');
  const [areaFilter, setAreaFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    loadDeliveries();
  }, [selectedDate, deliveryBoyFilter, areaFilter]);

  const loadDeliveries = () => {
    const list = dataService.getDailyDeliveries(
      selectedDate,
      deliveryBoyFilter !== 'ALL' ? deliveryBoyFilter : undefined,
      areaFilter !== 'ALL' ? areaFilter : undefined
    );
    setItems(list);
    setDeliveryBoys(dataService.getDeliveryBoys());
  };

  const handleStatusChange = (customerId: string, newStatus: DeliveryStatus) => {
    dataService.markDelivery({
      customerId,
      deliveryDate: selectedDate,
      status: newStatus,
      markedBy: 'a0000000-0000-0000-0000-000000000001', // Admin
    });
    loadDeliveries();
  };

  const handleBulkMarkDelivered = () => {
    const uncompletedIds = items
      .filter((i) => i.status !== 'DELIVERED')
      .map((i) => i.customer.id);

    if (uncompletedIds.length === 0) {
      setNotification('All listed customers are already marked delivered!');
      setTimeout(() => setNotification(''), 3000);
      return;
    }

    dataService.bulkMarkDeliveries({
      customerIds: uncompletedIds,
      deliveryDate: selectedDate,
      status: 'DELIVERED',
      markedBy: 'a0000000-0000-0000-0000-000000000001',
    });

    setNotification(`Marked ${uncompletedIds.length} customers as DELIVERED.`);
    setTimeout(() => setNotification(''), 3000);
    loadDeliveries();
  };

  // Filtered by client-side search
  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.customer.name.toLowerCase().includes(q) ||
      item.customer.phone.includes(q) ||
      item.customer.address.toLowerCase().includes(q)
    );
  });

  const deliveredCount = items.filter((i) => i.status === 'DELIVERED').length;
  const notDeliveredCount = items.filter((i) => i.status === 'NOT_DELIVERED').length;
  const pausedCount = items.filter((i) => i.status === 'PAUSED').length;
  const pendingCount = items.filter((i) => i.status === 'PENDING').length;

  const areas = Array.from(new Set(dataService.customers.map((c) => c.area))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Daily Delivery Checklist
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Log morning Lokmat distribution records. Only delivered copies are billed @ ₹5/day.
          </p>
        </div>

        {/* Date Selector & Bulk Action */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-3 py-1.5 shadow-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold text-slate-800 focus:outline-none bg-transparent"
            />
          </div>
          <button
            onClick={handleBulkMarkDelivered}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All Delivered</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Metric summary pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Delivered</span>
            <p className="text-xl font-bold text-emerald-700 mt-0.5">{deliveredCount}</p>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-600/30" />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Not Delivered</span>
            <p className="text-xl font-bold text-rose-700 mt-0.5">{notDeliveredCount}</p>
          </div>
          <XCircle className="w-6 h-6 text-rose-600/30" />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Paused</span>
            <p className="text-xl font-bold text-amber-700 mt-0.5">{pausedCount}</p>
          </div>
          <PauseCircle className="w-6 h-6 text-amber-600/30" />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Unmarked</span>
            <p className="text-xl font-bold text-slate-700 mt-0.5">{pendingCount}</p>
          </div>
          <Truck className="w-6 h-6 text-slate-400/30" />
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer, phone or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
          />
        </div>

        <div>
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-red-700"
          >
            <option value="ALL">All Areas</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={deliveryBoyFilter}
            onChange={(e) => setDeliveryBoyFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-red-700"
          >
            <option value="ALL">All Delivery Staff</option>
            {deliveryBoys.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.area})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Checklist Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Address & Area</th>
              <th className="py-3 px-4">Delivery Staff</th>
              <th className="py-3 px-4 text-center">Current Status</th>
              <th className="py-3 px-4 text-right">Update Status ({formatDate(selectedDate)})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.map(({ customer, status }) => (
              <tr key={customer.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4">
                  <p className="font-bold text-slate-900">{customer.name}</p>
                  <p className="text-[11px] text-slate-500">{customer.phone}</p>
                </td>
                <td className="py-3 px-4 max-w-xs truncate">
                  <p className="font-medium text-slate-800 truncate">{customer.address}</p>
                  <p className="text-[11px] text-slate-500">{customer.area}</p>
                </td>
                <td className="py-3 px-4">
                  <span className="font-medium text-slate-700">
                    {customer.delivery_boy?.name || 'Unassigned'}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  {status === 'DELIVERED' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Delivered</span>
                    </span>
                  ) : status === 'NOT_DELIVERED' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Not Delivered</span>
                    </span>
                  ) : status === 'PAUSED' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <PauseCircle className="w-3.5 h-3.5" />
                      <span>Paused</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-500">
                      Unmarked
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      onClick={() => handleStatusChange(customer.id, 'DELIVERED')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                        status === 'DELIVERED'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                      title="Mark as Delivered (₹5 charge)"
                    >
                      ✓ Delivered
                    </button>
                    <button
                      onClick={() => handleStatusChange(customer.id, 'NOT_DELIVERED')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                        status === 'NOT_DELIVERED'
                          ? 'bg-rose-700 text-white shadow-xs'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                      title="Mark as Not Delivered (₹0 charge)"
                    >
                      ✕ Not Delivered
                    </button>
                    <button
                      onClick={() => handleStatusChange(customer.id, 'PAUSED')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                        status === 'PAUSED'
                          ? 'bg-amber-700 text-white shadow-xs'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                      title="Mark Subscription as Paused for Today"
                    >
                      ⏸ Paused
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
