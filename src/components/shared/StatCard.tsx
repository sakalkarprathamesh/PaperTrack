import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'brand';
  className?: string;
}

export function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  variant = 'default',
  className,
}: StatCardProps) {
  const iconVariants = {
    default: 'bg-slate-100 text-slate-700',
    brand: 'bg-red-50 text-red-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-rose-50 text-rose-700',
  };

  return (
    <div
      className={cn(
        'bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between',
        className
      )}
    >
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
      </div>
      <div className={cn('p-3 rounded-lg flex items-center justify-center shrink-0', iconVariants[variant])}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}
