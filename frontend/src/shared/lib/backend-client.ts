const DEFAULT_BACKEND_URL = 'http://localhost:4000';

export function getBackendUrl(): string {
  return process.env.BACKEND_URL ?? DEFAULT_BACKEND_URL;
}

/**
 * Server-side fetch helper for the backend API.
 * Only call this from Server Components / Server Actions; the browser never talks to the backend directly.
 */
export async function backendFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${getBackendUrl()}${path}`, { cache: 'no-store', ...init });
}

