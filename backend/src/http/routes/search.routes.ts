import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Container } from '../composition-root.js';

const searchQuery = z.object({
  q: z.string().default(''),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export function registerSearchRoutes(app: FastifyInstance, container: Container): void {
  app.get('/search', async (request) => {
    const { q, limit } = searchQuery.parse(request.query);
    return container.globalSearch.execute(q, limit);
  });
}

