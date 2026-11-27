import { describe, expect, it, vi } from 'vitest';
import type { INoteRepository } from '../../src/core/domain/repositories/note.repository.interface.js';
import { GetTasksUseCase } from '../../src/core/use-cases/tasks/get-tasks.usecase.js';
import { ToggleTaskUseCase } from '../../src/core/use-cases/tasks/toggle-task.usecase.js';
import type { SaveNoteUseCase } from '../../src/core/use-cases/notes/save-note.usecase.js';

describe('Tasks Use Cases', () => {
  const mockNotes = [
    {
      id: 'note-1',
      title: 'Daily Plan',
      content: '# Daily\n- [ ] Task A\n- [x] Task B',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'note-2',
      title: 'Sprint Notes',
      content: '# Sprint\n- [ ] Task C',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const createMockRepo = (): INoteRepository =>
    ({
      findNotesWithTasks: vi.fn().mockResolvedValue(mockNotes),
      findById: vi.fn().mockImplementation(async (id: string) => {
        return mockNotes.find((n) => n.id === id) ?? null;
      }),
      findByTitle: vi.fn(),
      findByTitles: vi.fn(),
      listRecent: vi.fn(),
      listTitles: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      findLinkCandidates: vi.fn(),
      replaceIncomingLinks: vi.fn(),
      findBacklinks: vi.fn(),
      getGraphData: vi.fn(),
    }) as unknown as INoteRepository;

  it('GetTasksUseCase aggregates all tasks and computes correct statistics', async () => {
    const repo = createMockRepo();
    const useCase = new GetTasksUseCase(repo);

    const result = await useCase.execute();

    expect(result.tasks).toHaveLength(3);
    expect(result.stats).toEqual({
      total: 3,
      completed: 1,
      pending: 2,
      percentage: 33,
    });
  });

  it('ToggleTaskUseCase updates the task checkbox and calls saveNoteUseCase', async () => {
    const repo = createMockRepo();
    const mockSaveNoteUseCase = {
      execute: vi.fn().mockResolvedValue({
        id: 'note-1',
        title: 'Daily Plan',
        content: '# Daily\n- [x] Task A\n- [x] Task B',
      }),
    } as unknown as SaveNoteUseCase;

    const useCase = new ToggleTaskUseCase(repo, mockSaveNoteUseCase);

    const result = await useCase.execute({
      noteId: 'note-1',
      lineIndex: 1,
      completed: true,
    });

    expect(result.success).toBe(true);
    expect(mockSaveNoteUseCase.execute).toHaveBeenCalledWith({
      id: 'note-1',
      title: 'Daily Plan',
      content: '# Daily\n- [x] Task A\n- [x] Task B',
    });
    expect(result.task?.completed).toBe(true);
  });
});

