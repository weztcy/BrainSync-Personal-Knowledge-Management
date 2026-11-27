import { FileQuestion } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

export default function NotFound(): ReactNode {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-4">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Note Not Found</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
        The note you are looking for does not exist or may have been deleted.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/"
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
        >
          Go Home
        </Link>
        <Link
          href="/note/new"
          className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Create New Note
        </Link>
      </div>
    </div>
  );
}

