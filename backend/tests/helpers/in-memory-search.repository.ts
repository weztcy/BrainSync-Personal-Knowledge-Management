import type { SearchResult } from '../../src/core/domain/entities/search-result.entity.js';
import type { ISearchRepository } from '../../src/core/domain/repositories/search.repository.interface.js';
import { buildSearchSnippet } from '../../src/core/domain/services/search-snippet.service.js';
import type { InMemoryNoteRepository } from './in-memory-note.repository.js';
import type { InMemoryTagRepository } from './in-memory-tag.repository.js';

export class InMemorySearchRepository implements ISearchRepository {
  constructor(
    private readonly noteRepo: InMemoryNoteRepository,
    private readonly tagRepo: InMemoryTagRepository,
  ) {}

  async search(rawQuery: string, limit: number = 20): Promise<SearchResult[]> {
    const q = rawQuery.toLowerCase().trim().replace(/^#+/, '');
    if (!q) {
      return [];
    }

    const titleMatches: SearchResult[] = [];
    const contentMatches: SearchResult[] = [];
    const tagMatches: SearchResult[] = [];

    // Title matches (Priority 1)
    for (const note of this.noteRepo.notes.values()) {
      if (note.title.toLowerCase().includes(q)) {
        titleMatches.push({
          id: note.id,
          title: note.title,
          snippet: buildSearchSnippet(note.content, q),
          type: 'note',
        });
      }
    }

    // Tag matches (Priority 2)
    for (const tag of this.tagRepo.tags.values()) {
      if (tag.name.toLowerCase().includes(q)) {
        tagMatches.push({
          id: tag.id,
          title: `#${tag.name}`,
          type: 'tag',
        });
      }
    }

    // Content matches (Priority 3)
    const matchedTitleIds = new Set(titleMatches.map((t) => t.id));
    for (const note of this.noteRepo.notes.values()) {
      if (!matchedTitleIds.has(note.id) && note.content.toLowerCase().includes(q)) {
        contentMatches.push({
          id: note.id,
          title: note.title,
          snippet: buildSearchSnippet(note.content, q),
          type: 'note',
        });
      }
    }

    return [...titleMatches, ...tagMatches, ...contentMatches].slice(0, limit);
  }
}

