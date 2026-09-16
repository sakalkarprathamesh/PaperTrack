'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Filter,
  Download,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Eye,
  CreditCard,
  UserCheck,
  PauseCircle,
  Key,
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { Customer, DeliveryBoy } from '@/lib/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatCurrency } from '@/lib/utils';
import { exportToCSV } from '@/lib/export-csv';
import { CustomerLoginModal } from '@/components/admin/CustomerLoginModal';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('ALL');
  const [deliveryBoyFilter, setDeliveryBoyFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCustomerForLogin, setSelectedCustomerForLogin] = useState<Customer | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [search, areaFilter, deliveryBoyFilter, statusFilter]);

  const loadData = () => {
    const list = dataService.getCustomers(
      search || undefined,
      areaFilter !== 'ALL' ? areaFilter : undefined,
      deliveryBoyFilter !== 'ALL' ? deliveryBoyFilter : undefined,
      statusFilter !== 'ALL' ? statusFilter : undefined
    );
    setCustomers(list);
    setDeliveryBoys(dataService.getDeliveryBoys());
  };

  const areas = Array.from(new Set(dataService.customers.map((c) => c.area))).filter(Boolean);

  const handleExport = () => {
    const exportRows = customers.map((c) => ({
      ID: c.id,
      Name: c.name,
      Phone: c.phone,
      Address: c.address,
      Area: c.area,
      DeliveryBoy: c.delivery_boy?.name || 'Unassigned',
      Status: c.status,
      Balance: c.current_balance || 0,
      Advance: c.advance_balance || 0,
    }));
    exportToCSV('papertrack-customers', exportRows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customer Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage subscriber details, addresses, delivery routes, and pending balances.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <Link
            href="/admin/customers/new"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
            />
          </div>

          {/* Area Filter */}
          <div>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
            >
              <option value="ALL">All Areas</option>
              {areas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          {/* Delivery Staff Filter */}
          <div>
            <select
              value={deliveryBoyFilter}
              onChange={(e) => setDeliveryBoyFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
            >
              <option value="ALL">All Delivery Staff</option>
              {deliveryBoys.map((boy) => (
                <option key={boy.id} value={boy.id}>
                  {boy.name} ({boy.area})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
            >
              <option value="ALL">All Balances & Statuses</option>
              <option value="CLEARED">Cleared (₹0 Pending)</option>
              <option value="PENDING">Pending (Has Outstanding Due)</option>
              <option value="ACTIVE">Active Subscription</option>
              <option value="PAUSED">Paused Subscription</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {customers.length === 0 ? (
          <EmptyState
            title="No customers found"
            description="Try changing your search terms or filters, or add a new customer."
            action={
              <Link
                href="/admin/customers/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-700 text-white font-semibold text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Customer</span>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Address & Area</th>
                  <th className="py-3 px-4">Delivery Staff</th>
                  <th className="py-3 px-4">Subscription</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((customer) => {
                  const isCleared = (customer.current_balance || 0) <= 0;
                  return (
                    <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Phone */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="font-bold text-slate-900 hover:text-red-700 transition-colors"
                        >
                          {customer.name}
                        </Link>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{customer.phone}</span>
                        </div>
                      </td>

                      {/* Address & Area */}
                      <td className="py-3.5 px-4 max-w-xs truncate">
                        <p className="font-medium text-slate-800 truncate">{customer.address}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{customer.area}</span>
                        </p>
                      </td>

                      {/* Delivery Boy */}
                      <td className="py-3.5 px-4">
                        {customer.delivery_boy ? (
                          <span className="font-medium text-slate-800">
                            {customer.delivery_boy.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Subscription */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-800">Lokmat</span>
                          <span className="text-slate-500 block text-[11px]">₹5.00/day</span>
                        </div>
                      </td>

                      {/* Outstanding Balance */}
                      <td className="py-3.5 px-4 text-right">
                        <p
                          className={`font-bold ${
                            isCleared ? 'text-emerald-700' : 'text-amber-800'
                          }`}
                        >
                          {formatCurrency(customer.current_balance)}
                        </p>
                        {customer.advance_balance > 0 && (
                          <p className="text-[10px] text-emerald-600">
                            Adv: {formatCurrency(customer.advance_balance)}
                          </p>
                        )}
                      </td>

                      {/* Status Badge with Green Tick or Amber Warning */}
                      <td className="py-3.5 px-4 text-center">
                        {isCleared ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Cleared</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomerForLogin(customer);
                            setIsLoginModalOpen(true);
                          }}
                          title="Customer Portal Login Details"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-slate-700 font-medium text-xs transition-colors"
                        >
                          <Key className="w-3.5 h-3.5 text-slate-500" />
                          <span>Login</span>
                        </button>
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          title="View Profile & Statements"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Link>
                        <Link
                          href={`/admin/payments/new?customerId=${customer.id}`}
                          title="Record Payment"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Login Modal Preview */}
      <CustomerLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          setSelectedCustomerForLogin(null);
        }}
        customer={selectedCustomerForLogin}
      />
    </div>
  );
}
