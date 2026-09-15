'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Truck, CheckCircle2, Clock, Users, ArrowRight } from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { useAuth } from '@/lib/auth-context';
import { StatCard } from '@/components/shared/StatCard';

export default function DeliveryDashboardPage() {
  const { user } = useAuth();
  const deliveryBoyId = user?.deliveryBoyId || 'd0000000-0000-0000-0000-000000000001';

  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const s = dataService.getDeliveryBoyDashboardStats(deliveryBoyId);
    setStats(s);
  }, [deliveryBoyId]);

  if (!stats) return <div className="p-6 text-slate-500">Loading delivery status...</div>;

  const percent = stats.assignedCustomerCount > 0
    ? Math.round((stats.todayDeliveredCount / stats.assignedCustomerCount) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full">
            Staff Portal
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Welcome, {user?.fullName || 'Delivery Staff'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Shivaji Nagar Morning Newspaper Distribution Route
          </p>
        </div>

        <Link
          href="/delivery/today"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold text-xs shadow-xs"
        >
          <Truck className="w-4 h-4" />
          <span>Open Today's Checklist</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Assigned Route Customers"
          value={stats.assignedCustomerCount}
          subtext="Active morning subscribers"
          icon={Users}
          variant="brand"
        />
        <StatCard
          title="Delivered Today"
          value={stats.todayDeliveredCount}
          subtext={`${percent}% of assigned route finished`}
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="Remaining Deliveries"
          value={stats.remainingCount}
          subtext="Pending delivery confirmation"
          icon={Clock}
          variant="warning"
        />
      </div>

      {/* Quick Action Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h2 className="font-bold text-base text-slate-900">Delivery Guidelines</h2>
        <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
          <li>Complete morning deliveries before 7:30 AM.</li>
          <li>If a customer's gate is locked, check special notes in the checklist.</li>
          <li>Mark any paused or skipped houses immediately so billing calculates correctly.</li>
          <li>For route adjustments or address questions, contact Admin directly.</li>
        </ul>
      </div>
    </div>
  );
}
