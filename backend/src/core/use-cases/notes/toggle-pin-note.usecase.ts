import type { Note } from '../../domain/entities/note.entity.js';
import { NotFoundError } from '../../domain/errors/domain.errors.js';
import type { INoteRepository } from '../../domain/repositories/note.repository.interface.js';

export class TogglePinNoteUseCase {
  constructor(private readonly noteRepository: INoteRepository) {}

  async execute(id: string, isPinned: boolean): Promise<Note> {
    const existing = await this.noteRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Note ${id} not found`);
    }

    return this.noteRepository.togglePin(id, isPinned);
  }
}

