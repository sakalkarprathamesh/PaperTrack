'use client';

import React, { useState, useEffect } from 'react';
import { Users, MapPin, Search, Phone } from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { useAuth } from '@/lib/auth-context';

export default function DeliveryCustomersPage() {
  const { user } = useAuth();
  const deliveryBoyId = user?.deliveryBoyId || 'd0000000-0000-0000-0000-000000000001';

  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const list = dataService.customers.filter(
      (c) => c.delivery_boy_id === deliveryBoyId && c.status !== 'CANCELLED'
    );
    setCustomers(list);
  }, [deliveryBoyId]);

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Route Customers</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          List of households and delivery drop points on your assigned route.
        </p>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search subscriber or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-xs bg-white rounded-xl border border-slate-200 shadow-xs focus:outline-none focus:border-red-700"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>{filtered.length} Total Route Subscribers</span>
          <span className="text-emerald-700 font-semibold">Newspaper: Lokmat (Marathi)</span>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.map((c) => (
            <div key={c.id} className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                <p className="text-slate-600 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{c.address}, <strong className="text-slate-800">{c.area}</strong></span>
                </p>
                {c.notes && (
                  <p className="text-amber-800 text-[11px] mt-1 italic">
                    Drop Note: {c.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${c.phone}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call {c.phone}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
