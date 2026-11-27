import type { TagWithCount } from '../../domain/entities/tag.entity.js';
import type { ITagRepository } from '../../domain/repositories/tag.repository.interface.js';

export class ListTagsUseCase {
  constructor(private readonly tagRepository: ITagRepository) {}

  async execute(): Promise<TagWithCount[]> {
    return this.tagRepository.listAllWithCount();
  }
}

