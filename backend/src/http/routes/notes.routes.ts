import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Container } from '../composition-root.js';

const idParams = z.object({ id: z.uuid() });
const listQuery = z.object({ limit: z.coerce.number().int().min(1).max(200).optional() });
const byTitleQuery = z.object({ title: z.string().min(1) });
const createBody = z
  .object({
    title: z.string().optional(),
    content: z.string().optional(),
    manualTags: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  })
  .transform((val) => ({
    title: val.title,
    content: val.content,
    manualTags: val.manualTags ?? val.tags,
  }));

const updateBody = z
  .object({
    title: z.string(),
    content: z.string(),
    manualTags: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  })
  .transform((val) => ({
    title: val.title,
    content: val.content,
    manualTags: val.manualTags ?? val.tags,
  }));

const pinBody = z.object({ isPinned: z.boolean() });

export function registerNoteRoutes(app: FastifyInstance, container: Container): void {
  app.get('/notes', async (request) => {
    const { limit } = listQuery.parse(request.query);
    return container.listNotes.execute(limit);
  });

  // Registered before '/notes/:id' so "titles" and "by-title" are never parsed as ids.
  app.get('/notes/titles', async () => container.listNoteTitles.execute());

  app.get('/notes/by-title', async (request) => {
    const { title } = byTitleQuery.parse(request.query);
    return container.findNoteByTitle.execute(title);
  });

  app.get('/notes/:id', async (request) => {
    const { id } = idParams.parse(request.params);
    return container.getNote.execute(id);
  });

  app.post('/notes', async (request, reply) => {
    const body = createBody.parse(request.body ?? {});
    const note = await container.saveNote.execute(body);
    return reply.status(201).send(note);
  });

  app.put('/notes/:id', async (request) => {
    const { id } = idParams.parse(request.params);
    const body = updateBody.parse(request.body);
    return container.saveNote.execute({ id, ...body });
  });

  app.patch('/notes/:id/pin', async (request) => {
    const { id } = idParams.parse(request.params);
    const { isPinned } = pinBody.parse(request.body);
    return container.togglePinNote.execute(id, isPinned);
  });

  app.delete('/notes/:id', async (request) => {
    const { id } = idParams.parse(request.params);
    await container.deleteNote.execute(id);
    return { success: true };
  });
}

