import { ArrowUpRight, Link2 } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Backlink } from '@/shared/types';

interface BacklinksPaneProps {
  backlinks: Backlink[];
  currentNoteTitle: string;
}

export function BacklinksPane({ backlinks, currentNoteTitle }: BacklinksPaneProps): ReactNode {
  return (
    <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
        <Link2 className="w-4 h-4 text-slate-400" />
        <span>Linked Mentions ({backlinks.length})</span>
      </div>

      {backlinks.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 italic">
          No other notes link to &ldquo;{currentNoteTitle}&rdquo; yet.
        </p>
      ) : (
        <div className="grid gap-3">
          {backlinks.map((link) => (
            <Link
              key={link.noteId}
              href={`/note/${link.noteId}`}
              className="group block p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-800 transition-all shadow-xs"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-1.5">
                  {link.title}
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </div>
              {link.snippet && (
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 italic font-mono bg-white dark:bg-slate-800/80 p-2 rounded-md border border-slate-100 dark:border-slate-800">
                  &ldquo;{link.snippet}&rdquo;
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

