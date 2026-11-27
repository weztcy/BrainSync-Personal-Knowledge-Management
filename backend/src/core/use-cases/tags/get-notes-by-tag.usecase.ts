import type { NoteSummary } from '../../domain/entities/note.entity.js';
import type { ITagRepository } from '../../domain/repositories/tag.repository.interface.js';

export class GetNotesByTagUseCase {
  constructor(private readonly tagRepository: ITagRepository) {}

  async execute(tagName: string): Promise<NoteSummary[]> {
    const normalized = tagName.trim().replace(/^#+/, '').toLowerCase();
    if (!normalized) {
      return [];
    }
    return this.tagRepository.findNotesByTagName(normalized);
  }
}

