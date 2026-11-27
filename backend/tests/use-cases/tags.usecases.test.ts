import { beforeEach, describe, expect, it } from 'vitest';
import { GetNoteUseCase } from '../../src/core/use-cases/notes/get-note.usecase.js';
import { SaveNoteUseCase } from '../../src/core/use-cases/notes/save-note.usecase.js';
import { GetNotesByTagUseCase } from '../../src/core/use-cases/tags/get-notes-by-tag.usecase.js';
import { ListTagsUseCase } from '../../src/core/use-cases/tags/list-tags.usecase.js';
import { InMemoryNoteRepository } from '../helpers/in-memory-note.repository.js';
import { InMemoryTagRepository } from '../helpers/in-memory-tag.repository.js';

describe('Tags integration with Note Use Cases', () => {
  let noteRepo: InMemoryNoteRepository;
  let tagRepo: InMemoryTagRepository;
  let saveNote: SaveNoteUseCase;
  let getNote: GetNoteUseCase;
  let listTags: ListTagsUseCase;
  let getNotesByTag: GetNotesByTagUseCase;

  beforeEach(() => {
    noteRepo = new InMemoryNoteRepository();
    tagRepo = new InMemoryTagRepository(noteRepo);
    saveNote = new SaveNoteUseCase(noteRepo, tagRepo);
    getNote = new GetNoteUseCase(noteRepo, tagRepo);
    listTags = new ListTagsUseCase(tagRepo);
    getNotesByTag = new GetNotesByTagUseCase(tagRepo);
  });

  it('automatically extracts hashtags from note content and returns them', async () => {
    const note = await saveNote.execute({
      title: 'Learning React',
      content: 'Working with #react and #frontend frameworks.',
    });

    expect(note.tags).toEqual(['frontend', 'react']);
    const detail = await getNote.execute(note.id);
    expect(detail.tags).toEqual(['frontend', 'react']);

    const tagsWithCount = await listTags.execute();
    expect(tagsWithCount).toEqual([
      { id: expect.any(String), name: 'frontend', noteCount: 1 },
      { id: expect.any(String), name: 'react', noteCount: 1 },
    ]);
  });

  it('preserves manual tags when subsequent auto-save does not provide manualTags', async () => {
    // 1. Initial save with manual tags
    const note = await saveNote.execute({
      title: 'Manual Note',
      content: 'Just text.',
      manualTags: ['pkm', 'productivity'],
    });
    expect(note.tags).toEqual(['pkm', 'productivity']);

    // 2. Auto-save updates content and adds an inline tag, without passing manualTags
    const updated = await saveNote.execute({
      id: note.id,
      title: 'Manual Note',
      content: 'Now with #inline-tag.',
    });

    expect(updated.tags).toEqual(['inline-tag', 'pkm', 'productivity']);
  });

  it('replaces manual tags when manualTags is explicitly provided', async () => {
    const note = await saveNote.execute({
      title: 'Note',
      content: 'Content #auto',
      manualTags: ['initial'],
    });
    expect(note.tags).toEqual(['auto', 'initial']);

    const updated = await saveNote.execute({
      id: note.id,
      title: 'Note',
      content: 'Content #auto',
      manualTags: ['replaced'],
    });
    expect(updated.tags).toEqual(['auto', 'replaced']);
  });

  it('filters notes by tag name', async () => {
    await saveNote.execute({ title: 'Note 1', content: '#typescript' });
    await new Promise((r) => setTimeout(r, 10));
    await saveNote.execute({ title: 'Note 2', content: 'Plain note' });
    await new Promise((r) => setTimeout(r, 10));
    await saveNote.execute({ title: 'Note 3', content: 'Also #typescript and #web' });

    const tsNotes = await getNotesByTag.execute('typescript');
    expect(tsNotes.map((n) => n.title)).toEqual(['Note 3', 'Note 1']);

    const webNotes = await getNotesByTag.execute('web');
    expect(webNotes.map((n) => n.title)).toEqual(['Note 3']);

    const unknownNotes = await getNotesByTag.execute('nonexistent');
    expect(unknownNotes).toEqual([]);
  });
});
