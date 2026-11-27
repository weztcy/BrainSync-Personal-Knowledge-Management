import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/http/app.js';
import { createContainer } from '../../src/http/composition-root.js';
import { InMemoryNoteRepository } from '../helpers/in-memory-note.repository.js';
import { InMemorySearchRepository } from '../helpers/in-memory-search.repository.js';
import { InMemoryTagRepository } from '../helpers/in-memory-tag.repository.js';

describe('notes routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const noteRepo = new InMemoryNoteRepository();
    const tagRepo = new InMemoryTagRepository(noteRepo);
    const searchRepo = new InMemorySearchRepository(noteRepo, tagRepo);
    app = buildApp({
      container: createContainer({ notes: noteRepo, tags: tagRepo, search: searchRepo }),
      logger: false,
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates, reads, updates, lists and deletes a note', async () => {
    const created = await app.inject({ method: 'POST', url: '/notes', payload: { title: 'Hello', content: 'World' } });
    expect(created.statusCode).toBe(201);
    const { id } = created.json<{ id: string }>();

    const read = await app.inject({ method: 'GET', url: `/notes/${id}` });
    expect(read.json<{ title: string }>().title).toBe('Hello');

    const updated = await app.inject({ method: 'PUT', url: `/notes/${id}`, payload: { title: 'Hello', content: 'Changed' } });
    expect(updated.json<{ content: string }>().content).toBe('Changed');

    const list = await app.inject({ method: 'GET', url: '/notes?limit=10' });
    expect(list.json<unknown[]>()).toHaveLength(1);

    const byTitle = await app.inject({ method: 'GET', url: '/notes/by-title?title=hello' });
    expect(byTitle.json<{ id: string }>().id).toBe(id);

    const titles = await app.inject({ method: 'GET', url: '/notes/titles' });
    expect(titles.json<{ title: string }[]>()[0]?.title).toBe('Hello');

    const removed = await app.inject({ method: 'DELETE', url: `/notes/${id}` });
    expect(removed.json()).toEqual({ success: true });
    expect((await app.inject({ method: 'GET', url: `/notes/${id}` })).statusCode).toBe(404);
  });

  it('maps conflicts to 409 and validation problems to 400', async () => {
    await app.inject({ method: 'POST', url: '/notes', payload: { title: 'Dup' } });
    const dup = await app.inject({ method: 'POST', url: '/notes', payload: { title: 'dup' } });
    expect(dup.statusCode).toBe(409);

    const badId = await app.inject({ method: 'GET', url: '/notes/not-a-uuid' });
    expect(badId.statusCode).toBe(400);

    const badBody = await app.inject({ method: 'PUT', url: '/notes/018f2a4e-0000-7000-8000-000000000000', payload: {} });
    expect(badBody.statusCode).toBe(400);
  });
});

