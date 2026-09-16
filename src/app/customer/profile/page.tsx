'use client';

import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Newspaper, Calendar, Truck, ShieldCheck, Mail } from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { useAuth } from '@/lib/auth-context';
import { Customer } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/StatusBadge';

export default function CustomerProfilePage() {
  const { user } = useAuth();
  const customerId = user?.customerId;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const settings = dataService.getAgencySettings();

  useEffect(() => {
    if (customerId) {
      const c = dataService.getCustomerById(customerId);
      setCustomer(c);
    }
  }, [customerId]);

  if (!customerId) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3 my-8">
        <h2 className="text-base font-bold text-slate-900">No Subscriber Profile Linked</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          We could not locate an active subscriber record for this account. Please contact your agency administrator.
        </p>
      </div>
    );
  }

  if (!customer) return <div className="p-8 text-slate-500">Loading subscriber profile...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Subscription Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Your active newspaper delivery details and agency contact support.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-800 flex items-center justify-center font-bold text-lg">
              {customer.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{customer.name}</h2>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{customer.phone}</span>
              </p>
            </div>
          </div>
          <StatusBadge status={customer.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
              Delivery Address
            </span>
            <p className="font-semibold text-slate-800 mt-0.5">{customer.address}</p>
            <p className="text-slate-500">Area: {customer.area}</p>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
              Member Since
            </span>
            <p className="font-semibold text-slate-800 mt-0.5">{formatDate(customer.start_date)}</p>
          </div>
        </div>

        {/* Subscription details */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
          <span className="font-bold text-slate-800 block text-xs">Subscribed Newspaper</span>
          <div className="flex justify-between text-slate-700">
            <span>Publication:</span>
            <strong className="text-slate-900">Lokmat Daily (Marathi)</strong>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Daily Rate:</span>
            <strong className="text-slate-900">₹5.00 / copy (Billed on delivered days)</strong>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Delivery Staff:</span>
            <strong className="text-slate-900">
              {customer.delivery_boy ? customer.delivery_boy.name : 'Ramesh Shinde'}
            </strong>
          </div>
        </div>
      </div>

      {/* Agency Support Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-3">
        <h3 className="font-bold text-sm text-slate-900">Need Help or Want to Pause Delivery?</h3>
        <p className="text-xs text-slate-600">
          Contact Admin (Agency Owner) for vacation holds, address updates, or billing questions.
        </p>

        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Agency Contact</span>
            <p className="font-bold text-slate-900 mt-0.5">{settings.agency_phone}</p>
            <p className="text-slate-500 text-[11px]">{settings.agency_name}</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">UPI ID for Payments</span>
            <p className="font-mono font-bold text-red-700 mt-0.5">{settings.upi_id}</p>
            <p className="text-slate-500 text-[11px]">Direct account transfer</p>
          </div>
        </div>
      </div>
    </div>
  );
}
