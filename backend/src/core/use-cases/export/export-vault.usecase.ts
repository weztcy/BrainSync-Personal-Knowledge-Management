import { prisma } from '../../infrastructure/database/prisma.client.js';
import { buildZipArchive, type ZipEntry } from '../../domain/services/zip-builder.service.js';

export class ExportVaultUseCase {
  async execute(): Promise<Buffer> {
    const notes = await prisma.note.findMany({
      select: {
        title: true,
        content: true,
      },
      orderBy: {
        title: 'asc',
      },
    });

    const entries: ZipEntry[] = notes.map((note) => {
      // Sanitize filename across Windows, macOS, and Linux
      const safeTitle = note.title.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'Untitled';
      return {
        filename: `${safeTitle}.md`,
        data: note.content,
      };
    });

    return buildZipArchive(entries);
  }
}

