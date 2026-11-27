'use server';

import { backendFetch } from '@/shared/lib/backend-client';
import type { GraphData } from '@/shared/types';

export async function getGraphDataAction(): Promise<GraphData> {
  try {
    const res = await backendFetch('/graph');
    if (!res.ok) {
      return { nodes: [], edges: [] };
    }
    return (await res.json()) as GraphData;
  } catch {
    return { nodes: [], edges: [] };
  }
}

