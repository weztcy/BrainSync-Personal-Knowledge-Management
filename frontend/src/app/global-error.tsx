'use client';

import type { ReactNode } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): ReactNode {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center p-4 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <h2 className="text-xl font-bold">Something went wrong!</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-md text-center">
          {error.message || 'An unexpected error occurred in the application.'}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-xs"
        >
          Try again
        </button>
      </body>
    </html>
  );
}

