'use client';

import { CalendarDays, Download, FilePlus2, FileText, Hash, ListTodo, Network, Pin, Search, Upload } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { getOrCreateDailyNoteAction, togglePinNoteAction } from '@/features/notes/actions/note.actions';
import { ThemeToggle } from '@/features/theme/components/ThemeToggle';
import { cn } from '@/shared/lib/cn';
import type { NoteSummary, TagWithCount } from '@/shared/types';

const emptySubscribe = () => () => {};
const getIsMacClient = () => /Mac/i.test(navigator.userAgent);
const getIsMacServer = () => false;

interface SidebarProps {
  recentNotes: NoteSummary[];
  tags: TagWithCount[];
  onOpenSearch: () => void;
  onOpenImport?: () => void;
  onCloseMobileDrawer?: () => void;
}

export function Sidebar({
  recentNotes,
  tags,
  onOpenSearch,
  onOpenImport,
  onCloseMobileDrawer,
}: SidebarProps): ReactNode {
  const pathname = usePathname();
  const router = useRouter();

  const handleNewNote = () => {
    onCloseMobileDrawer?.();
    router.push('/note/new');
  };

  const handleDailyNote = async () => {
    onCloseMobileDrawer?.();
    const res = await getOrCreateDailyNoteAction();
    if (res.noteId) {
      router.push(`/note/${res.noteId}`);
      router.refresh();
    }
  };

  const isMac = useSyncExternalStore(emptySubscribe, getIsMacClient, getIsMacServer);
  const modifierKey = isMac ? '⌘' : 'Ctrl+';

  const pinnedNotes = useMemo(() => recentNotes.filter((n) => n.isPinned), [recentNotes]);
  const regularNotes = useMemo(() => recentNotes.filter((n) => !n.isPinned), [recentNotes]);

  return (
    <aside className="w-64 h-full flex flex-col bg-slate-50/80 dark:bg-slate-900/80 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 select-none">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
        <Link
          href="/"
          onClick={onCloseMobileDrawer}
          className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-black shadow-xs">
            B
          </div>
          <span>BrainSync</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Action Buttons */}
      <div className="p-3 space-y-1.5 border-b border-slate-200/60 dark:border-slate-800">
        <button
          type="button"
          onClick={handleNewNote}
          className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors"
        >
          <span className="flex items-center gap-2">
            <FilePlus2 className="w-4 h-4" />
            New Note
          </span>
          <kbd suppressHydrationWarning className="text-[10px] bg-blue-700/80 px-1.5 py-0.5 rounded font-mono">
            {modifierKey}N
          </kbd>
        </button>

        <button
          type="button"
          onClick={handleDailyNote}
          className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700/60"
        >
          <span className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-emerald-500" />
            Daily Note
          </span>
          <kbd suppressHydrationWarning className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-500">
            {modifierKey}J
          </kbd>
        </button>

        <button
          type="button"
          onClick={() => {
            onCloseMobileDrawer?.();
            onOpenSearch();
          }}
          className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700/60"
        >
          <span className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            Search...
          </span>
          <kbd suppressHydrationWarning className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-500">
            {modifierKey}K
          </kbd>
        </button>

        <Link
          href="/graph"
          onClick={onCloseMobileDrawer}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors border shadow-xs',
            pathname === '/graph'
              ? 'bg-indigo-100/80 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-100 border-indigo-300 dark:border-indigo-800 font-medium'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/60',
          )}
        >
          <span className="flex items-center gap-2">
            <Network className="w-4 h-4 text-indigo-500" />
            Graph View
          </span>
          <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-500">
            3D
          </span>
        </Link>

        <Link
          href="/tasks"
          onClick={onCloseMobileDrawer}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors border shadow-xs',
            pathname === '/tasks'
              ? 'bg-amber-100/80 dark:bg-amber-950/70 text-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-800 font-medium'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/60',
          )}
        >
          <span className="flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-amber-500" />
            Tasks
          </span>
          <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-500">
            GTD
          </span>
        </Link>
      </div>

      {/* Scrollable Navigation: Notes & Tags */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Pinned Notes Section */}
        {pinnedNotes.length > 0 && (
          <div>
            <div className="px-2 mb-2 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Pin className="w-3 h-3 fill-amber-500/30" />
              Pinned ({pinnedNotes.length})
            </div>
            <ul className="space-y-0.5">
              {pinnedNotes.map((note) => {
                const isActive = pathname === `/note/${note.id}`;
                return (
                  <li key={note.id} className="group relative">
                    <Link
                      href={`/note/${note.id}`}
                      onClick={onCloseMobileDrawer}
                      className={cn(
                        'flex items-center gap-2 pl-2.5 pr-7 py-1.5 rounded-lg text-sm transition-colors',
                        isActive
                          ? 'bg-amber-100/80 dark:bg-amber-950/70 text-amber-900 dark:text-amber-100 font-medium'
                          : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300',
                      )}
                    >
                      <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500/30 shrink-0" />
                      <span className="truncate flex-1">{note.title}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        await togglePinNoteAction(note.id, false);
                        router.refresh();
                      }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-200/50 dark:hover:bg-amber-900/40 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Unpin note"
                      aria-label="Unpin note"
                    >
                      <Pin className="w-3.5 h-3.5 fill-amber-500" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Recent Notes Section */}
        <div>
          <div className="px-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Notes ({regularNotes.length})
          </div>
          {regularNotes.length === 0 ? (
            <div className="px-2 py-3 text-xs text-slate-400 italic">No notes created yet.</div>
          ) : (
            <ul className="space-y-0.5">
              {regularNotes.map((note) => {
                const isActive = pathname === `/note/${note.id}`;
                return (
                  <li key={note.id} className="group relative">
                    <Link
                      href={`/note/${note.id}`}
                      onClick={onCloseMobileDrawer}
                      className={cn(
                        'flex items-center gap-2 pl-2.5 pr-7 py-1.5 rounded-lg text-sm transition-colors',
                        isActive
                          ? 'bg-blue-100/80 dark:bg-blue-950/70 text-blue-900 dark:text-blue-100 font-medium'
                          : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300',
                      )}
                    >
                      <FileText
                        className={cn(
                          'w-4 h-4 shrink-0',
                          isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400',
                        )}
                      />
                      <span className="truncate flex-1">{note.title}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        await togglePinNoteAction(note.id, true);
                        router.refresh();
                      }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-amber-500 hover:bg-slate-200/60 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Pin note"
                      aria-label="Pin note"
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Tag Explorer Section */}
        <div>
          <div className="px-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Tags ({tags.length})
          </div>
          {tags.length === 0 ? (
            <div className="px-2 py-2 text-xs text-slate-400 italic">
              No tags yet. Use #tag in your notes!
            </div>
          ) : (
            <ul className="space-y-0.5">
              {tags.map((tag) => {
                const isActive = pathname === `/tags/${encodeURIComponent(tag.name)}`;
                return (
                  <li key={tag.id}>
                    <Link
                      href={`/tags/${encodeURIComponent(tag.name)}`}
                      onClick={onCloseMobileDrawer}
                      className={cn(
                        'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors',
                        isActive
                          ? 'bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-100 font-medium'
                          : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300',
                      )}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Hash className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{tag.name}</span>
                      </span>
                      <span className="text-xs bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.5 rounded-full font-mono text-slate-500 shrink-0">
                        {tag.noteCount}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Footer / Vault Import & Export */}
      <div className="p-3 border-t border-slate-200/60 dark:border-slate-800 space-y-1.5">
        <button
          type="button"
          onClick={() => {
            onCloseMobileDrawer?.();
            onOpenImport?.();
          }}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700/60 group text-left"
          title="Import Markdown files or a ZIP vault"
        >
          <span className="flex items-center gap-2">
            <Upload className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            Import Vault / Notes
          </span>
          <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-500">
            MD/ZIP
          </span>
        </button>

        <a
          href="/api/export"
          download="brainsync-vault-export.zip"
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700/60 group"
          title="Export all notes and metadata as a standard Markdown ZIP vault"
        >
          <span className="flex items-center gap-2">
            <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            Export Vault (.zip)
          </span>
          <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-500">
            ZIP
          </span>
        </a>
      </div>
    </aside>
  );
}

