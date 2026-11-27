'use server';

import { backendFetch } from '@/shared/lib/backend-client';
import type { SearchResult } from '@/shared/types';

export async function globalSearchAction(query: string, limit: number = 20): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) {
    return [];
  }

  try {
    const res = await backendFetch(`/search?q=${encodeURIComponent(q)}&limit=${limit}`);
    if (!res.ok) {
      return [];
    }
    return (await res.json()) as SearchResult[];
  } catch {
    return [];
  }
}

