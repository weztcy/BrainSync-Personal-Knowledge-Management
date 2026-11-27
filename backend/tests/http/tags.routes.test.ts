import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/http/app.js';
import { createContainer } from '../../src/http/composition-root.js';
import { InMemoryNoteRepository } from '../helpers/in-memory-note.repository.js';
import { InMemorySearchRepository } from '../helpers/in-memory-search.repository.js';
import { InMemoryTagRepository } from '../helpers/in-memory-tag.repository.js';

describe('tags routes', () => {
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

  it('exposes tag list and tag notes filtering via HTTP', async () => {
    await app.inject({
      method: 'POST',
      url: '/notes',
      payload: { title: 'Docker Note', content: 'Using #devops and #docker' },
    });

    const tagsRes = await app.inject({ method: 'GET', url: '/tags' });
    expect(tagsRes.statusCode).toBe(200);
    const tags = tagsRes.json<Array<{ name: string; noteCount: number }>>();
    expect(tags.map((t) => t.name)).toEqual(['devops', 'docker']);

    const filterRes = await app.inject({ method: 'GET', url: '/tags/docker/notes' });
    expect(filterRes.statusCode).toBe(200);
    const filtered = filterRes.json<Array<{ title: string }>>();
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.title).toBe('Docker Note');
  });
});
