'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, LogIn, Newspaper } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function UnauthorizedPage() {
  const { user, logout } = useAuth();

  const getPermittedHome = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    if (user.role === 'DELIVERY_BOY') return '/delivery/today';
    return '/customer/dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full shadow-lg text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
            HTTP 403 Forbidden
          </span>
          <h1 className="text-xl font-black text-slate-900 mt-2">
            Access Denied
          </h1>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            You do not have the required operational permissions to view this section of PaperTrack. This event has been recorded for security.
          </p>
        </div>

        {user && (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
            <span>Signed in as: </span>
            <strong className="text-slate-900">{user.email}</strong>
            <span className="block text-[11px] text-slate-500 mt-0.5">
              Assigned Role: <strong className="uppercase text-red-700">{user.role.replace('_', ' ')}</strong>
            </span>
          </div>
        )}

        <div className="pt-2 flex flex-col gap-2.5">
          <Link
            href={getPermittedHome()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Permitted Portal</span>
          </Link>

          <button
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
          >
            <LogIn className="w-4 h-4 text-slate-500" />
            <span>Sign In with a Different Account</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <Newspaper className="w-3.5 h-3.5 text-red-700" />
          <span>PaperTrack • Lokmat Agency Security</span>
        </div>
      </div>
    </div>
  );
}
