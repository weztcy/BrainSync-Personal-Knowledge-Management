import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { getNoteAction } from '@/features/notes/actions/note.actions';
import { MarkdownEditor } from '@/features/notes/components/MarkdownEditor';

interface NotePageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: NotePageProps): Promise<Metadata> {
  const { id } = await params;
  const note = await getNoteAction(id);
  if (!note) {
    return { title: 'Note Not Found - BrainSync' };
  }
  return {
    title: `${note.title || 'Untitled'} - BrainSync`,
  };
}

export default async function NotePage({ params }: NotePageProps): Promise<ReactNode> {
  const { id } = await params;
  const note = await getNoteAction(id);

  if (!note) {
    notFound();
  }

  return <MarkdownEditor key={note.id} initialNote={note} />;
}

