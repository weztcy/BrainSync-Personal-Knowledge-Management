'use server';

import { revalidatePath } from 'next/cache';
import { backendFetch } from '@/shared/lib/backend-client';
import type { ImportVaultResult } from '@/shared/types';

export interface ImportNoteItem {
  filename?: string;
  title?: string;
  content: string;
}

export async function importNotesAction(
  notes: ImportNoteItem[],
  overwrite: boolean = false,
): Promise<{ success: boolean; result?: ImportVaultResult; error?: string }> {
  try {
    const res = await backendFetch('/import/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, overwrite }),
    });

    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      return { success: false, error: err.error ?? 'Failed to import notes' };
    }

    const result = (await res.json()) as ImportVaultResult;
    revalidatePath('/');
    revalidatePath('/tasks');
    revalidatePath('/graph');
    return { success: true, result };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error communicating with backend';
    return { success: false, error: message };
  }
}

export async function importZipAction(
  zipBase64: string,
  overwrite: boolean = false,
): Promise<{ success: boolean; result?: ImportVaultResult; error?: string }> {
  try {
    const res = await backendFetch('/import/zip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zipBase64, overwrite }),
    });

    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      return { success: false, error: err.error ?? 'Failed to import ZIP archive' };
    }

    const result = (await res.json()) as ImportVaultResult;
    revalidatePath('/');
    revalidatePath('/tasks');
    revalidatePath('/graph');
    return { success: true, result };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error communicating with backend';
    return { success: false, error: message };
  }
}

