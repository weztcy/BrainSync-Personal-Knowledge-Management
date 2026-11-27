import type { SearchResult } from '../../domain/entities/search-result.entity.js';
import type { ISearchRepository } from '../../domain/repositories/search.repository.interface.js';
import { buildSearchSnippet } from '../../domain/services/search-snippet.service.js';
import { prisma } from './prisma.client.js';

interface RawSearchNoteRow {
  id: string;
  title: string;
  content: string;
  score: number;
}

interface RawSearchTagRow {
  id: string;
  name: string;
  score: number;
}

export class PrismaSearchRepository implements ISearchRepository {
  async search(rawQuery: string, limit: number = 20): Promise<SearchResult[]> {
    const cleanQuery = rawQuery.trim().replace(/^#+/, '');
    if (!cleanQuery) {
      return [];
    }

    const likeQuery = `%${cleanQuery}%`;

    // 1. Title matches (highest weight)
    const titleRows = await prisma.$queryRaw<RawSearchNoteRow[]>`
      SELECT
        id,
        title,
        content,
        (
          similarity(title, ${cleanQuery}) * 10
          + (CASE WHEN title ILIKE ${likeQuery} THEN 15.0 ELSE 0.0 END)
          + (CASE WHEN lower(title) = lower(${cleanQuery}) THEN 30.0 ELSE 0.0 END)
        )::float as score
      FROM "Note"
      WHERE title ILIKE ${likeQuery}
         OR similarity(title, ${cleanQuery}) > 0.15
      ORDER BY score DESC
      LIMIT ${limit}
    `;

    // 2. Tag matches
    const tagRows = await prisma.$queryRaw<RawSearchTagRow[]>`
      SELECT
        id,
        name,
        (
          similarity(name, ${cleanQuery}) * 8
          + (CASE WHEN name ILIKE ${likeQuery} THEN 10.0 ELSE 0.0 END)
          + (CASE WHEN lower(name) = lower(${cleanQuery}) THEN 20.0 ELSE 0.0 END)
        )::float as score
      FROM "Tag"
      WHERE name ILIKE ${likeQuery}
         OR similarity(name, ${cleanQuery}) > 0.2
      ORDER BY score DESC
      LIMIT ${limit}
    `;

    // 3. Content matches (for notes not already captured in title matches)
    const matchedTitleIds = new Set(titleRows.map((r) => r.id));
    const contentRows = await prisma.$queryRaw<RawSearchNoteRow[]>`
      SELECT
        id,
        title,
        content,
        (
          similarity(content, ${cleanQuery}) * 2
          + (CASE WHEN content ILIKE ${likeQuery} THEN 3.0 ELSE 0.0 END)
        )::float as score
      FROM "Note"
      WHERE (content ILIKE ${likeQuery} OR similarity(content, ${cleanQuery}) > 0.05)
      ORDER BY score DESC
      LIMIT ${limit * 2}
    `;

    const results: Array<SearchResult & { score: number }> = [];

    // Add title matches
    for (const row of titleRows) {
      results.push({
        id: row.id,
        title: row.title,
        snippet: buildSearchSnippet(row.content, cleanQuery),
        type: 'note',
        score: row.score,
      });
    }

    // Add tag matches
    for (const tag of tagRows) {
      results.push({
        id: tag.id,
        title: `#${tag.name}`,
        type: 'tag',
        score: tag.score,
      });
    }

    // Add content matches (only for notes not already in title matches)
    for (const row of contentRows) {
      if (!matchedTitleIds.has(row.id)) {
        results.push({
          id: row.id,
          title: row.title,
          snippet: buildSearchSnippet(row.content, cleanQuery),
          type: 'note',
          score: row.score,
        });
      }
    }

    // Sort by priority score DESC and take limit
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ id, title, snippet, type }) => ({
        id,
        title,
        ...(snippet ? { snippet } : {}),
        type,
      }));
  }
}

