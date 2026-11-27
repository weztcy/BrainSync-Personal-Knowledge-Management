import { ArrowUpRight, Calendar, FileText, Hash } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { getNotesByTagAction } from '@/features/tags/actions/tag.actions';

interface TagPageProps {
  params: Promise<{ name: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  return {
    title: `#${decoded} - BrainSync`,
  };
}

export default async function TagPage({ params }: TagPageProps): Promise<ReactNode> {
  const { name } = await params;
  const tagName = decodeURIComponent(name);
  const notes = await getNotesByTagAction(tagName);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <Hash className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            #{tagName}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'} tagged with this topic
          </p>
        </div>
      </div>

      {/* Notes List */}
      <div className="mt-6">
        {notes.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500">
            <p className="text-sm">No notes currently found tagged with #{tagName}.</p>
            <Link
              href="/note/new"
              className="mt-4 inline-block text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              + Create a new note
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {notes.map((note) => {
              const updatedDate = new Date(note.updatedAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });

              return (
                <Link
                  key={note.id}
                  href={`/note/${note.id}`}
                  className="group block p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-emerald-500 group-hover:text-emerald-600 shrink-0" />
                      <span className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        {note.title}
                      </span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0" />
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Updated {updatedDate}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

