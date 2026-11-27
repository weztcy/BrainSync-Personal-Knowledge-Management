import { beforeEach, describe, expect, it } from 'vitest';
import { SaveNoteUseCase } from '../../src/core/use-cases/notes/save-note.usecase.js';
import { GlobalSearchUseCase } from '../../src/core/use-cases/search/global-search.usecase.js';
import { InMemoryNoteRepository } from '../helpers/in-memory-note.repository.js';
import { InMemorySearchRepository } from '../helpers/in-memory-search.repository.js';
import { InMemoryTagRepository } from '../helpers/in-memory-tag.repository.js';

describe('GlobalSearchUseCase', () => {
  let noteRepo: InMemoryNoteRepository;
  let tagRepo: InMemoryTagRepository;
  let searchRepo: InMemorySearchRepository;
  let saveNote: SaveNoteUseCase;
  let searchUseCase: GlobalSearchUseCase;

  beforeEach(() => {
    noteRepo = new InMemoryNoteRepository();
    tagRepo = new InMemoryTagRepository(noteRepo);
    searchRepo = new InMemorySearchRepository(noteRepo, tagRepo);
    saveNote = new SaveNoteUseCase(noteRepo, tagRepo);
    searchUseCase = new GlobalSearchUseCase(searchRepo);
  });

  it('returns empty array when query is empty or whitespace', async () => {
    expect(await searchUseCase.execute('')).toEqual([]);
    expect(await searchUseCase.execute('   ')).toEqual([]);
  });

  it('ranks title matches ahead of tag matches and content matches', async () => {
    // Note 1: Match in content only
    await saveNote.execute({ title: 'Cooking Guide', content: 'We need to discuss react here.' });
    // Note 2: Match in title
    await saveNote.execute({ title: 'React Essentials', content: 'Modern web development.' });
    // Note 3: Match via Tag
    await saveNote.execute({ title: 'Web Tools', content: 'Tools and libs', manualTags: ['react-dom'] });

    const results = await searchUseCase.execute('react');

    expect(results).toHaveLength(3);
    // Priority 1: Title
    expect(results[0]?.title).toBe('React Essentials');
    expect(results[0]?.type).toBe('note');
    // Priority 2: Tag
    expect(results[1]?.title).toBe('#react-dom');
    expect(results[1]?.type).toBe('tag');
    // Priority 3: Content
    expect(results[2]?.title).toBe('Cooking Guide');
    expect(results[2]?.type).toBe('note');
    expect(results[2]?.snippet).toContain('react');
  });

  it('clamps limit to maximum allowable', async () => {
    for (let i = 0; i < 60; i++) {
      await saveNote.execute({ title: `Item ${i}`, content: 'keyword' });
    }
    const results = await searchUseCase.execute('keyword', 100);
    expect(results.length).toBeLessThanOrEqual(50);
  });
});

