'use client';

import { Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { ImportModal } from '@/features/notes/components/ImportModal';
import { Omnibar } from '@/features/search/components/Omnibar';
import { getOrCreateDailyNoteAction } from '@/features/notes/actions/note.actions';
import type { NoteSummary, TagWithCount } from '@/shared/types';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
  recentNotes: NoteSummary[];
  tags: TagWithCount[];
}

export function AppLayout({ children, recentNotes, tags }: AppLayoutProps): ReactNode {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Global keyboard shortcuts:
  // - Cmd/Ctrl + K: search Omnibar
  // - Cmd/Ctrl + N: new note
  // - Cmd/Ctrl + J: daily note
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.metaKey || e.ctrlKey;

      if (isModifier && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (isModifier && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setMobileDrawerOpen(false);
        router.push('/note/new');
      } else if (isModifier && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setMobileDrawerOpen(false);
        void getOrCreateDailyNoteAction().then((res) => {
          if (res.noteId) {
            router.push(`/note/${res.noteId}`);
            router.refresh();
          }
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar
          recentNotes={recentNotes}
          tags={tags}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenImport={() => setImportOpen(true)}
        />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div
            className="w-72 h-full bg-white dark:bg-slate-900 shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 flex justify-end border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Sidebar
                recentNotes={recentNotes}
                tags={tags}
                onOpenSearch={() => {
                  setMobileDrawerOpen(false);
                  setSearchOpen(true);
                }}
                onOpenImport={() => {
                  setMobileDrawerOpen(false);
                  setImportOpen(true);
                }}
                onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Mobile Top Navigation Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="p-1.5 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm">BrainSync</span>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="p-1.5 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800"
            aria-label="Search"
          >
            <span className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">Search</span>
          </button>
        </header>

        {/* Child Pages (Editor, Tags view, etc.) */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Global Omnibar Modal */}
      <Omnibar isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Global Vault / Notes Import Modal */}
      <ImportModal isOpen={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}

