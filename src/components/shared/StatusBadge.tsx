import React from 'react';
import { Check, Clock, AlertCircle, PauseCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BillStatus, CustomerStatus, DeliveryStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: BillStatus | CustomerStatus | DeliveryStatus | 'CLEARED' | 'PENDING' | 'PARTIAL' | string | null | undefined;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  if (!status) return null;

  const upper = String(status).toUpperCase();

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  if (upper === 'CLEARED' || upper === 'DELIVERED') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200',
          sizeClasses,
          className
        )}
      >
        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>{upper === 'CLEARED' ? 'Cleared' : 'Delivered'}</span>
      </span>
    );
  }

  if (upper === 'PENDING') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200',
          sizeClasses,
          className
        )}
      >
        <Clock className="w-3.5 h-3.5 stroke-[2]" />
        <span>Pending</span>
      </span>
    );
  }

  if (upper === 'PARTIAL') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200',
          sizeClasses,
          className
        )}
      >
        <AlertCircle className="w-3.5 h-3.5 stroke-[2]" />
        <span>Partial</span>
      </span>
    );
  }

  if (upper === 'ACTIVE') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200',
          sizeClasses,
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <span>Active</span>
      </span>
    );
  }

  if (upper === 'PAUSED') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200',
          sizeClasses,
          className
        )}
      >
        <PauseCircle className="w-3.5 h-3.5 stroke-[2]" />
        <span>Paused</span>
      </span>
    );
  }

  if (upper === 'NOT_DELIVERED' || upper === 'CANCELLED') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200',
          sizeClasses,
          className
        )}
      >
        <XCircle className="w-3.5 h-3.5 stroke-[2]" />
        <span>{upper === 'NOT_DELIVERED' ? 'Not Delivered' : 'Cancelled'}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-200',
        sizeClasses,
        className
      )}
    >
      {status}
    </span>
  );
}
