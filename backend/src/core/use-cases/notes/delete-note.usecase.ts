import { NotFoundError } from '../../domain/errors/domain.errors.js';
import type { INoteRepository } from '../../domain/repositories/note.repository.interface.js';

export class DeleteNoteUseCase {
  constructor(private readonly noteRepository: INoteRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.noteRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Note ${id} not found`);
    }
    // Links and tag assignments are removed by ON DELETE CASCADE (DATABASE_DESIGN.md).
    await this.noteRepository.delete(id);
  }
}

