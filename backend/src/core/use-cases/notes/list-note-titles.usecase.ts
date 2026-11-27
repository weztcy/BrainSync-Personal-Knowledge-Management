import type { NoteTitle } from '../../domain/entities/note.entity.js';
import type { INoteRepository } from '../../domain/repositories/note.repository.interface.js';

export class ListNoteTitlesUseCase {
  constructor(private readonly noteRepository: INoteRepository) {}

  async execute(): Promise<NoteTitle[]> {
    return this.noteRepository.listTitles();
  }
}

