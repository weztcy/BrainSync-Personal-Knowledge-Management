import type { FastifyInstance } from 'fastify';
import type { Container } from '../composition-root.js';

export function registerGraphRoutes(app: FastifyInstance, container: Container): void {
  app.get('/graph', async () => {
    return container.getGraph.execute();
  });
}

