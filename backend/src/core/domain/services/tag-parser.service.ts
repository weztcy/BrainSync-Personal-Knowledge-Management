import { maskCode } from './link-parser.service.js';

// Matches #tag preceded by start of line, whitespace, or punctuation.
// Disallows URLs, HTML entities, and headings.
const HASHTAG_PATTERN = /(?:^|[^\w/&?#])#([a-zA-Z0-9_-]+)(?=[^\w-]|$)/g;

/**
 * Extracts unique hashtag names (lowercased) from markdown content.
 * Code blocks and inline code are ignored.
 * Headings (e.g. `# Heading`) and pure numbers (e.g. `#123`) are ignored.
 */
export function extractHashTags(content: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];

  const masked = maskCode(content);
  for (const match of masked.matchAll(HASHTAG_PATTERN)) {
    const rawTag = match[1] ?? '';
    // Require at least one letter so issue numbers like #42 aren't mistaken for tags
    if (!/[a-zA-Z]/.test(rawTag)) {
      continue;
    }
    const normalized = rawTag.toLowerCase().trim();
    if (normalized.length > 0 && !seen.has(normalized)) {
      seen.add(normalized);
      tags.push(normalized);
    }
  }

  return tags;
}

/**
 * Normalizes a list of tag names (e.g. from manual input):
 * trims, lowercases, removes `#` prefix if present, filters out invalid/empty strings.
 */
export function normalizeTagNames(rawTags: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const raw of rawTags) {
    const cleaned = raw.trim().replace(/^#+/, '').toLowerCase();
    if (cleaned.length > 0 && /^[a-zA-Z0-9_-]+$/.test(cleaned) && /[a-zA-Z]/.test(cleaned)) {
      if (!seen.has(cleaned)) {
        seen.add(cleaned);
        normalized.push(cleaned);
      }
    }
  }

  return normalized;
}

