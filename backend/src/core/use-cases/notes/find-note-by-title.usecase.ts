import type { Note } from '../../domain/entities/note.entity.js';
import { NotFoundError } from '../../domain/errors/domain.errors.js';
import type { INoteRepository } from '../../domain/repositories/note.repository.interface.js';

export class FindNoteByTitleUseCase {
  constructor(private readonly noteRepository: INoteRepository) {}

  async execute(title: string): Promise<Note> {
    const note = await this.noteRepository.findByTitle(title.trim());
    if (!note) {
      throw new NotFoundError(`No note titled "${title}"`);
    }
    return note;
  }
}

