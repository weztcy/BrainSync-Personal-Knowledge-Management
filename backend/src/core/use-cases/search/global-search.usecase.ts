import type { SearchResult } from '../../domain/entities/search-result.entity.js';
import type { ISearchRepository } from '../../domain/repositories/search.repository.interface.js';

export const DEFAULT_SEARCH_LIMIT = 20;
export const MAX_SEARCH_LIMIT = 50;

export class GlobalSearchUseCase {
  constructor(private readonly searchRepository: ISearchRepository) {}

  async execute(rawQuery: string, limit: number = DEFAULT_SEARCH_LIMIT): Promise<SearchResult[]> {
    const query = rawQuery.trim();
    if (query.length === 0) {
      return [];
    }

    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), MAX_SEARCH_LIMIT);
    return this.searchRepository.search(query, safeLimit);
  }
}

