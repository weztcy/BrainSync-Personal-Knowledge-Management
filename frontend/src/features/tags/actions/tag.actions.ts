'use server';

import { backendFetch } from '@/shared/lib/backend-client';
import type { NoteSummary, TagWithCount } from '@/shared/types';

export async function listTagsAction(): Promise<TagWithCount[]> {
  try {
    const res = await backendFetch('/tags');
    if (!res.ok) {
      return [];
    }
    return (await res.json()) as TagWithCount[];
  } catch {
    return [];
  }
}

export async function getNotesByTagAction(tagName: string): Promise<NoteSummary[]> {
  try {
    const res = await backendFetch(`/tags/${encodeURIComponent(tagName)}/notes`);
    if (!res.ok) {
      return [];
    }
    return (await res.json()) as NoteSummary[];
  } catch {
    return [];
  }
}

