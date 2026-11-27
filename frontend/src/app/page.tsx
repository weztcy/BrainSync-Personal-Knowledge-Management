import { redirect } from 'next/navigation';
import { listRecentNotesAction } from '@/features/notes/actions/note.actions';

export const dynamic = 'force-dynamic';

export default async function HomePage(): Promise<never> {
  const recentNotes = await listRecentNotesAction(1);
  const firstNote = recentNotes[0];

  if (firstNote) {
    redirect(`/note/${firstNote.id}`);
  }

  redirect('/note/new');
}
