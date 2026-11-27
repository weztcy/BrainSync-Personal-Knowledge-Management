import { beforeEach, describe, expect, it } from 'vitest';
import { ConflictError, NotFoundError, ValidationError } from '../../src/core/domain/errors/domain.errors.js';
import { DeleteNoteUseCase } from '../../src/core/use-cases/notes/delete-note.usecase.js';
import { ListNotesUseCase } from '../../src/core/use-cases/notes/list-notes.usecase.js';
import { SaveNoteUseCase } from '../../src/core/use-cases/notes/save-note.usecase.js';
import { TogglePinNoteUseCase } from '../../src/core/use-cases/notes/toggle-pin-note.usecase.js';
import { InMemoryNoteRepository } from '../helpers/in-memory-note.repository.js';

describe('SaveNoteUseCase', () => {
  let repository: InMemoryNoteRepository;
  let useCase: SaveNoteUseCase;

  beforeEach(() => {
    repository = new InMemoryNoteRepository();
    useCase = new SaveNoteUseCase(repository);
  });

  it('creates a note and trims the title', async () => {
    const note = await useCase.execute({ title: '  React Context  ', content: 'hello' });
    expect(note.title).toBe('React Context');
    expect(note.content).toBe('hello');
    expect(repository.notes.size).toBe(1);
  });

  it('generates unique "Untitled" titles for blank titles', async () => {
    const first = await useCase.execute({});
    const second = await useCase.execute({ title: '   ' });
    const third = await useCase.execute({});
    expect([first.title, second.title, third.title]).toEqual(['Untitled', 'Untitled 2', 'Untitled 3']);
  });

  it('rejects a duplicate title ignoring case on create', async () => {
    await useCase.execute({ title: 'State Management' });
    await expect(useCase.execute({ title: 'state management' })).rejects.toBeInstanceOf(ConflictError);
  });

  it('updates an existing note and keeps createdAt', async () => {
    const created = await useCase.execute({ title: 'A', content: 'one' });
    const updated = await useCase.execute({ id: created.id, title: 'A', content: 'two' });
    expect(updated.content).toBe('two');
    expect(updated.createdAt).toEqual(created.createdAt);
  });

  it('allows an update that keeps (or re-cases) its own title', async () => {
    const created = await useCase.execute({ title: 'Mixed Case' });
    const updated = await useCase.execute({ id: created.id, title: 'mixed case', content: 'x' });
    expect(updated.title).toBe('mixed case');
  });

  it('rejects renaming onto another note title', async () => {
    await useCase.execute({ title: 'One' });
    const two = await useCase.execute({ title: 'Two' });
    await expect(useCase.execute({ id: two.id, title: 'ONE', content: '' })).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejects a blank title on update', async () => {
    const note = await useCase.execute({ title: 'Keep me' });
    await expect(useCase.execute({ id: note.id, title: '  ', content: '' })).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects titles longer than 255 characters', async () => {
    await expect(useCase.execute({ title: 'x'.repeat(256) })).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws NotFoundError when updating an unknown note', async () => {
    await expect(useCase.execute({ id: 'missing', title: 'X', content: '' })).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('ListNotesUseCase', () => {
  it('returns most recently updated first and clamps the limit', async () => {
    const repository = new InMemoryNoteRepository();
    const save = new SaveNoteUseCase(repository);
    await save.execute({ title: 'Old' });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await save.execute({ title: 'New' });

    const list = new ListNotesUseCase(repository);
    expect((await list.execute()).map((n) => n.title)).toEqual(['New', 'Old']);
    expect(await list.execute(0)).toHaveLength(1);
  });
});

describe('DeleteNoteUseCase', () => {
  it('deletes an existing note and rejects unknown ids', async () => {
    const repository = new InMemoryNoteRepository();
    const note = await new SaveNoteUseCase(repository).execute({ title: 'Bye' });
    const useCase = new DeleteNoteUseCase(repository);

    await useCase.execute(note.id);
    expect(repository.notes.size).toBe(0);
    await expect(useCase.execute(note.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('TogglePinNoteUseCase', () => {
  it('toggles pin status of an existing note', async () => {
    const repository = new InMemoryNoteRepository();
    const note = await new SaveNoteUseCase(repository).execute({ title: 'Important MOC' });
    const useCase = new TogglePinNoteUseCase(repository);

    const pinned = await useCase.execute(note.id, true);
    expect(pinned.isPinned).toBe(true);

    const unpinned = await useCase.execute(note.id, false);
    expect(unpinned.isPinned).toBe(false);
  });

  it('rejects toggling pin on non-existent note', async () => {
    const repository = new InMemoryNoteRepository();
    const useCase = new TogglePinNoteUseCase(repository);

    await expect(useCase.execute('non-existent-id', true)).rejects.toBeInstanceOf(NotFoundError);
  });
});

