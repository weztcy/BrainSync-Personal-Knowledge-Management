import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Container } from '../composition-root.js';
import { ZipReaderService } from '../../core/domain/services/zip-reader.service.js';

const importNotesBody = z.object({
  notes: z.array(
    z.object({
      filename: z.string().optional(),
      title: z.string().optional(),
      content: z.string(),
    }),
  ),
  overwrite: z.boolean().optional(),
});

const importZipBody = z.object({
  zipBase64: z.string(),
  overwrite: z.boolean().optional(),
});

export function registerImportRoutes(app: FastifyInstance, container: Container): void {
  // Batch notes import (from dropped .md files)
  app.post('/import/notes', async (request) => {
    const body = importNotesBody.parse(request.body);
    return container.importVault.execute(body);
  });

  // ZIP archive import (from dropped .zip file)
  app.post('/import/zip', async (request) => {
    const body = importZipBody.parse(request.body);
    const buffer = Buffer.from(body.zipBase64, 'base64');
    const files = ZipReaderService.extractMarkdownFiles(buffer);

    return container.importVault.execute({
      notes: files,
      overwrite: body.overwrite,
    });
  });
}

