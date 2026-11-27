import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { listRecentNotesAction } from '@/features/notes/actions/note.actions';
import { listTagsAction } from '@/features/tags/actions/tag.actions';
import { AppLayout } from '@/features/navigation/components/AppLayout';
import { ThemeProvider } from '@/features/theme/components/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'BrainSync - Personal Knowledge Management',
  description: 'Distraction-free PKM with bi-directional wiki-links, auto-save, and fuzzy search.',
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}): Promise<ReactNode> {
  const [recentNotes, tags] = await Promise.all([
    listRecentNotesAction(),
    listTagsAction(),
  ]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <ThemeProvider>
          <AppLayout recentNotes={recentNotes} tags={tags}>
            {children}
          </AppLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
