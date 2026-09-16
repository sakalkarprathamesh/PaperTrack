import React from 'react';
import Link from 'next/link';
import { Newspaper, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full shadow-lg text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
          <Newspaper className="w-6 h-6 text-red-700" />
        </div>
        <div>
          <span className="text-xs font-mono font-bold text-red-700 uppercase">404 Not Found</span>
          <h2 className="text-xl font-black text-slate-900 mt-1">Page or Record Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">
            The requested customer, bill, or page does not exist or may have been archived.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-colors shadow-xs"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
