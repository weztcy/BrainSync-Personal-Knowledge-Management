import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/http/app.js';
import { createContainer } from '../../src/http/composition-root.js';
import { InMemoryNoteRepository } from '../helpers/in-memory-note.repository.js';
import { InMemorySearchRepository } from '../helpers/in-memory-search.repository.js';
import { InMemoryTagRepository } from '../helpers/in-memory-tag.repository.js';

describe('search routes', () => {
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

  it('performs global search via GET /search?q=', async () => {
    await app.inject({
      method: 'POST',
      url: '/notes',
      payload: { title: 'Omnibar Search', content: 'Testing omnibar integration' },
    });

    const res = await app.inject({ method: 'GET', url: '/search?q=omnibar' });
    expect(res.statusCode).toBe(200);
    const results = res.json<Array<{ title: string; type: string }>>();
    expect(results).toHaveLength(1);
    expect(results[0]?.title).toBe('Omnibar Search');
    expect(results[0]?.type).toBe('note');
  });

  it('returns empty array when q parameter is omitted or empty', async () => {
    const res = await app.inject({ method: 'GET', url: '/search' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });
});

