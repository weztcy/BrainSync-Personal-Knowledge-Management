import { NextResponse } from 'next/server';
import { backendFetch } from '@/shared/lib/backend-client';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  try {
    const res = await backendFetch('/export/zip');
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to export vault' }, { status: 500 });
    }

    const arrayBuffer = await res.arrayBuffer();

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="brainsync-vault-export.zip"',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error exporting vault' }, { status: 500 });
  }
}

