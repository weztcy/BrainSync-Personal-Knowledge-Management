import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Container } from '../composition-root.js';

const toggleBody = z.object({
  noteId: z.string().uuid(),
  lineIndex: z.number().int().min(0),
  completed: z.boolean(),
});

export function registerTaskRoutes(app: FastifyInstance, container: Container): void {
  app.get('/tasks', async () => {
    return container.getTasks.execute();
  });

  app.patch('/tasks/toggle', async (request) => {
    const body = toggleBody.parse(request.body);
    return container.toggleTask.execute(body);
  });
}

