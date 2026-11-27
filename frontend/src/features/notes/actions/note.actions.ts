'use server';

import { revalidatePath } from 'next/cache';
import { backendFetch } from '@/shared/lib/backend-client';
import type { NoteDetail, NoteSummary, NoteTitle } from '@/shared/types';

export async function listRecentNotesAction(limit: number = 50): Promise<NoteSummary[]> {
  try {
    const res = await backendFetch(`/notes?limit=${limit}`);
    if (!res.ok) {
      return [];
    }
    return (await res.json()) as NoteSummary[];
  } catch {
    return [];
  }
}

export async function listNoteTitlesAction(): Promise<NoteTitle[]> {
  try {
    const res = await backendFetch('/notes/titles');
    if (!res.ok) {
      return [];
    }
    return (await res.json()) as NoteTitle[];
  } catch {
    return [];
  }
}

export async function getNoteAction(id: string): Promise<NoteDetail | null> {
  try {
    const res = await backendFetch(`/notes/${id}`);
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as NoteDetail;
  } catch {
    return null;
  }
}

export async function findNoteByTitleAction(title: string): Promise<NoteSummary | null> {
  try {
    const res = await backendFetch(`/notes/by-title?title=${encodeURIComponent(title)}`);
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as NoteSummary;
  } catch {
    return null;
  }
}

export interface SaveNotePayload {
  id?: string;
  title?: string;
  content: string;
  manualTags?: string[];
}

export async function saveNoteAction(
  payload: SaveNotePayload,
): Promise<{ success: boolean; data?: NoteDetail; error?: string }> {
  try {
    const isNew = !payload.id;
    const path = isNew ? '/notes' : `/notes/${payload.id}`;
    const method = isNew ? 'POST' : 'PUT';

    const res = await backendFetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      return { success: false, error: err.error ?? 'Failed to save note' };
    }

    const saved = (await res.json()) as { id: string };

    // Revalidate paths for instant client-side update
    revalidatePath('/');
    revalidatePath(`/note/${saved.id}`);

    // Fetch the updated note detail with full backlinks & tags
    const detail = await getNoteAction(saved.id);
    return { success: true, data: detail ?? undefined };
  } catch {
    return { success: false, error: 'Network error communicating with backend' };
  }
}

export async function deleteNoteAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await backendFetch(`/notes/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      return { success: false, error: err.error ?? 'Failed to delete note' };
    }

    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false, error: 'Network error deleting note' };
  }
}

function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function getOrCreateDailyNoteAction(): Promise<{ noteId: string | null; error?: string }> {
  try {
    const todayTitle = getLocalDateString();
    const existing = await findNoteByTitleAction(todayTitle);

    if (existing) {
      return { noteId: existing.id };
    }

    const template = `# ${todayTitle}

### Tasks & Priorities
- [ ] 

### Daily Log
- 

### Reflections & Learnings


#daily-notes`;

    const saved = await saveNoteAction({
      title: todayTitle,
      content: template,
      manualTags: ['daily-notes'],
    });

    if (saved.success && saved.data) {
      return { noteId: saved.data.id };
    }

    return { noteId: null, error: saved.error ?? 'Failed to create daily note' };
  } catch {
    return { noteId: null, error: 'Network error communicating with backend' };
  }
}

export async function togglePinNoteAction(
  id: string,
  isPinned: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await backendFetch(`/notes/${id}/pin`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPinned }),
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      return { success: false, error: err.message ?? 'Failed to toggle pin' };
    }

    revalidatePath('/', 'layout');
    revalidatePath(`/note/${id}`);
    return { success: true };
  } catch {
    return { success: false, error: 'Network error toggling pin' };
  }
}

