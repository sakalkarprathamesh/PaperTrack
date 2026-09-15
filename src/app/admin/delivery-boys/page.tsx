'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserCheck, Plus, Phone, MapPin, Users, CheckCircle2, XCircle } from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { DeliveryBoy } from '@/lib/types';

export default function DeliveryBoysPage() {
  const [staffList, setStaffList] = useState<any[]>([]);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = () => {
    setStaffList(dataService.getDeliveryBoys());
  };

  const handleToggleActive = (id: string, current: boolean) => {
    dataService.updateDeliveryBoy(id, { is_active: !current });
    loadStaff();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Delivery Staff Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage newspaper delivery boys, route assignments, and daily distribution rosters.
          </p>
        </div>

        <Link
          href="/admin/delivery-boys/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Delivery Staff</span>
        </Link>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {staffList.map((boy) => (
          <div
            key={boy.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
                    {boy.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{boy.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{boy.phone}</span>
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    boy.is_active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {boy.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">Assigned Area: <strong className="text-slate-800">{boy.area}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    Subscribers on Route:{' '}
                    <strong className="text-slate-800 font-bold">{boy.assigned_customer_count || 0}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                onClick={() => handleToggleActive(boy.id, boy.is_active)}
                className={`text-[11px] font-semibold hover:underline ${
                  boy.is_active ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                {boy.is_active ? 'Deactivate' : 'Activate Staff'}
              </button>
              <Link
                href={`/admin/delivery?deliveryBoyId=${boy.id}`}
                className="text-red-700 font-semibold hover:underline"
              >
                View Route Checklist →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
