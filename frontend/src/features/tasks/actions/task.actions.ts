'use server';

import { revalidatePath } from 'next/cache';
import { backendFetch } from '@/shared/lib/backend-client';
import type { NoteTask, TaskListResult } from '@/shared/types';

export async function listTasksAction(): Promise<TaskListResult> {
  try {
    const res = await backendFetch('/tasks');
    if (!res.ok) {
      return {
        tasks: [],
        stats: { total: 0, completed: 0, pending: 0, percentage: 0 },
      };
    }
    return (await res.json()) as TaskListResult;
  } catch {
    return {
      tasks: [],
      stats: { total: 0, completed: 0, pending: 0, percentage: 0 },
    };
  }
}

export async function toggleTaskAction(
  noteId: string,
  lineIndex: number,
  completed: boolean,
): Promise<{ success: boolean; task?: NoteTask; error?: string }> {
  try {
    const res = await backendFetch('/tasks/toggle', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId, lineIndex, completed }),
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      return { success: false, error: err.message ?? 'Failed to toggle task' };
    }

    const data = (await res.json()) as { success: boolean; task?: NoteTask };
    revalidatePath('/tasks');
    revalidatePath(`/note/${noteId}`);
    return data;
  } catch {
    return { success: false, error: 'Network error toggling task' };
  }
}

