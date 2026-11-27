import type { NoteSummary } from '../../domain/entities/note.entity.js';
import type { INoteRepository } from '../../domain/repositories/note.repository.interface.js';

export const DEFAULT_LIST_LIMIT = 50;
export const MAX_LIST_LIMIT = 200;

export class ListNotesUseCase {
  constructor(private readonly noteRepository: INoteRepository) {}

  async execute(limit: number = DEFAULT_LIST_LIMIT): Promise<NoteSummary[]> {
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), MAX_LIST_LIMIT);
    return this.noteRepository.listRecent(safeLimit);
  }
}

