import { beforeEach, describe, expect, it } from 'vitest';
import { GetNoteUseCase } from '../../src/core/use-cases/notes/get-note.usecase.js';
import { SaveNoteUseCase } from '../../src/core/use-cases/notes/save-note.usecase.js';
import { InMemoryNoteRepository } from '../helpers/in-memory-note.repository.js';

describe('note links', () => {
  let repository: InMemoryNoteRepository;
  let save: SaveNoteUseCase;
  let get: GetNoteUseCase;

  beforeEach(() => {
    repository = new InMemoryNoteRepository();
    save = new SaveNoteUseCase(repository);
    get = new GetNoteUseCase(repository);
  });

  it('links to existing notes and reports ghost links as unresolved', async () => {
    const target = await save.execute({ title: 'State Management' });
    const source = await save.execute({ title: 'React Context', content: 'Uses [[state management]] and [[Missing]].' });

    expect(repository.linkedTitlesFrom(source.id)).toEqual(['State Management']);
    const detail = await get.execute(source.id);
    expect(detail.links).toEqual([
      { title: 'state management', noteId: target.id },
      { title: 'Missing', noteId: null },
    ]);
  });

  it('shows backlinks with a snippet on the target note', async () => {
    const target = await save.execute({ title: 'State Management' });
    await save.execute({ title: 'React Context', content: 'Intro. It relies on [[State Management]] a lot. Bye.' });

    const detail = await get.execute(target.id);
    expect(detail.backlinks).toHaveLength(1);
    expect(detail.backlinks[0]?.title).toBe('React Context');
    expect(detail.backlinks[0]?.snippet).toBe('It relies on [[State Management]] a lot.');
  });

  it('replaces outgoing links when the content changes', async () => {
    await save.execute({ title: 'A' });
    await save.execute({ title: 'B' });
    const source = await save.execute({ title: 'Src', content: '[[A]]' });
    await save.execute({ id: source.id, title: 'Src', content: '[[B]]' });
    expect(repository.linkedTitlesFrom(source.id)).toEqual(['B']);
  });

  it('back-fills a ghost link when the target note is created later', async () => {
    const source = await save.execute({ title: 'Src', content: 'Read [[Later]]' });
    expect(repository.linkedTitlesFrom(source.id)).toEqual([]);

    const later = await save.execute({ title: 'Later' });
    expect(repository.linkedTitlesFrom(source.id)).toEqual(['Later']);
    expect((await get.execute(later.id)).backlinks.map((b) => b.title)).toEqual(['Src']);
  });

  it('re-resolves incoming links when a note is renamed', async () => {
    const target = await save.execute({ title: 'Old Name' });
    const source = await save.execute({ title: 'Src', content: '[[Old Name]] and [[New Name]]' });
    expect(repository.linkedTitlesFrom(source.id)).toEqual(['Old Name']);

    await save.execute({ id: target.id, title: 'New Name', content: '' });
    expect(repository.linkedTitlesFrom(source.id)).toEqual(['New Name']);
  });

  it('ignores self links and links inside code', async () => {
    const note = await save.execute({ title: 'Self', content: '[[Self]] `[[Other]]`' });
    await save.execute({ title: 'Other' });
    expect(repository.linkedTitlesFrom(note.id)).toEqual([]);
  });

  it('drops edges when a note is deleted', async () => {
    const target = await save.execute({ title: 'T' });
    const source = await save.execute({ title: 'S', content: '[[T]]' });
    await repository.delete(target.id);
    expect(repository.linkedTitlesFrom(source.id)).toEqual([]);
  });
});

