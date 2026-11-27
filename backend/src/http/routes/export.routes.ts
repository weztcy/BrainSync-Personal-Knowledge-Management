import type { FastifyInstance } from 'fastify';
import type { Container } from '../composition-root.js';

export function registerExportRoutes(app: FastifyInstance, container: Container): void {
  app.get('/export/zip', async (_, reply) => {
    const zipBuffer = await container.exportVault.execute();

    return reply
      .header('Content-Type', 'application/zip')
      .header('Content-Disposition', 'attachment; filename="brainsync-vault-export.zip"')
      .send(zipBuffer);
  });
}

