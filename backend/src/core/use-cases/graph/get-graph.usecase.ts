import type { GraphData } from '../../domain/entities/graph.entity.js';
import type { INoteRepository } from '../../domain/repositories/note.repository.interface.js';

export class GetGraphUseCase {
  constructor(private readonly noteRepository: INoteRepository) {}

  async execute(): Promise<GraphData> {
    return this.noteRepository.getGraphData();
  }
}

