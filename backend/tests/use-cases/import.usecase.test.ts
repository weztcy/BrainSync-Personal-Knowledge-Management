import { describe, expect, it, vi } from 'vitest';
import type { INoteRepository } from '../../src/core/domain/repositories/note.repository.interface.js';
import type { SaveNoteUseCase } from '../../src/core/use-cases/notes/save-note.usecase.js';
import { ImportVaultUseCase } from '../../src/core/use-cases/export/import-vault.usecase.js';

describe('ImportVaultUseCase', () => {
  const createMockRepo = (existingTitles: string[] = []): INoteRepository =>
    ({
      findByTitle: vi.fn().mockImplementation(async (title: string) => {
        if (existingTitles.includes(title)) {
          return { id: `id-${title}`, title, content: 'existing', isPinned: false, createdAt: new Date(), updatedAt: new Date() };
        }
        return null;
      }),
      findById: vi.fn(),
      findByTitles: vi.fn(),
      listRecent: vi.fn(),
      listTitles: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      findLinkCandidates: vi.fn(),
      replaceIncomingLinks: vi.fn(),
      findBacklinks: vi.fn(),
      getGraphData: vi.fn(),
      findNotesWithTasks: vi.fn(),
      togglePin: vi.fn(),
    }) as unknown as INoteRepository;

  it('imports new markdown notes successfully', async () => {
    const repo = createMockRepo();
    const mockSaveNote = {
      execute: vi.fn().mockResolvedValue({ id: 'new-id' }),
    } as unknown as SaveNoteUseCase;

    const useCase = new ImportVaultUseCase(repo, mockSaveNote);
    const result = await useCase.execute({
      notes: [
        { filename: 'TypeScript Guide.md', content: '# TypeScript Guide\nBest practices' },
        { title: 'Custom Title', content: 'Some content' },
      ],
    });

    expect(result.total).toBe(2);
    expect(result.imported).toBe(2);
    expect(result.skipped).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(mockSaveNote.execute).toHaveBeenCalledTimes(2);
  });

  it('skips existing notes when overwrite is false', async () => {
    const repo = createMockRepo(['Existing Note']);
    const mockSaveNote = {
      execute: vi.fn().mockResolvedValue({ id: 'new-id' }),
    } as unknown as SaveNoteUseCase;

    const useCase = new ImportVaultUseCase(repo, mockSaveNote);
    const result = await useCase.execute({
      notes: [
        { filename: 'Existing Note.md', content: 'New content' },
        { filename: 'Brand New Note.md', content: 'Brand new' },
      ],
      overwrite: false,
    });

    expect(result.total).toBe(2);
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);
    expect(mockSaveNote.execute).toHaveBeenCalledTimes(1);
  });

  it('overwrites existing notes when overwrite is true', async () => {
    const repo = createMockRepo(['Existing Note']);
    const mockSaveNote = {
      execute: vi.fn().mockResolvedValue({ id: 'id-Existing Note' }),
    } as unknown as SaveNoteUseCase;

    const useCase = new ImportVaultUseCase(repo, mockSaveNote);
    const result = await useCase.execute({
      notes: [{ filename: 'Existing Note.md', content: 'Overwritten content' }],
      overwrite: true,
    });

    expect(result.total).toBe(1);
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);
    expect(mockSaveNote.execute).toHaveBeenCalledWith({
      id: 'id-Existing Note',
      title: 'Existing Note',
      content: 'Overwritten content',
    });
  });
});

