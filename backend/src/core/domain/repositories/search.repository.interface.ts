import type { SearchResult } from '../entities/search-result.entity.js';

export interface ISearchRepository {
  /**
   * Performs fuzzy search across note titles, tags, and note content.
   * Priority: 1) Title matches, 2) Tag matches, 3) Content matches.
   */
  search(query: string, limit?: number): Promise<SearchResult[]>;
}

