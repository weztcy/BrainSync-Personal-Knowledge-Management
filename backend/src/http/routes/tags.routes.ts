import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Container } from '../composition-root.js';

const tagParams = z.object({
  name: z.string().min(1),
});

export function registerTagRoutes(app: FastifyInstance, container: Container): void {
  app.get('/tags', async () => {
    return container.listTags.execute();
  });

  app.get('/tags/:name/notes', async (request) => {
    const { name } = tagParams.parse(request.params);
    return container.getNotesByTag.execute(name);
  });
}

