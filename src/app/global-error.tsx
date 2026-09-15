'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full shadow-lg text-center space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Application Error</h2>
          <p className="text-xs text-slate-500">
            A critical error occurred. Please refresh the page or try again.
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold"
          >
            Refresh Application
          </button>
        </div>
      </body>
    </html>
  );
}
