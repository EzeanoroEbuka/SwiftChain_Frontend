'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-4 dark:bg-slate-950">
      <div className="rounded-full bg-red-100 p-5 dark:bg-red-900/30">
        <AlertTriangle className="h-10 w-10 text-red-500" />
      </div>
      <div className="text-center">
        <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
          Something went wrong
        </h1>
        <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
      </div>
      <button
        onClick={reset}
        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-95"
      >
        Try again
      </button>
    </div>
  );
}
