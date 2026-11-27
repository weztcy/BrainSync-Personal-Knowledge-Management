import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { MarkdownEditor } from '@/features/notes/components/MarkdownEditor';

interface NewNotePageProps {
  searchParams: Promise<{ title?: string }>;
}

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'New Note - BrainSync',
};

export default async function NewNotePage({
  searchParams,
}: NewNotePageProps): Promise<ReactNode> {
  const { title } = await searchParams;

  return <MarkdownEditor key={title ?? 'new'} initialTitle={title} />;
}

