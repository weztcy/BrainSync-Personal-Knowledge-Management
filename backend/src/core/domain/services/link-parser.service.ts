/**
 * Pure text parsing for the knowledge graph. No imports: lives in the innermost layer.
 */

const WIKI_LINK_PATTERN = /\[\[([^[\]\n|]+)\]\]/g;
const FENCED_CODE_PATTERN = /(^|\n)[ \t]*(```|~~~)[^\n]*\n[\s\S]*?(\n[ \t]*\2[ \t]*(?=\n|$)|$)/g;
const INLINE_CODE_PATTERN = /`[^`\n]*`/g;

const SNIPPET_MAX_LENGTH = 160;

function blank(match: string): string {
  // Same length, newlines kept, so offsets stay valid for the original text.
  return match.replace(/[^\n]/g, ' ');
}

/** Replaces code (fenced blocks and inline spans) with spaces, preserving string offsets. */
export function maskCode(content: string): string {
  return content.replace(FENCED_CODE_PATTERN, blank).replace(INLINE_CODE_PATTERN, blank);
}

/** Unique `[[Title]]` targets (case-insensitive), in order of first appearance. Code is ignored. */
export function extractWikiLinks(content: string): string[] {
  const seen = new Set<string>();
  const titles: string[] = [];

  for (const match of maskCode(content).matchAll(WIKI_LINK_PATTERN)) {
    const title = (match[1] ?? '').trim();
    const key = title.toLowerCase();
    if (title !== '' && !seen.has(key)) {
      seen.add(key);
      titles.push(title);
    }
  }
  return titles;
}

/** True when `content` contains a (non-code) link to `title`, ignoring case. */
export function linksToTitle(content: string, title: string): boolean {
  const key = title.trim().toLowerCase();
  return extractWikiLinks(content).some((linked) => linked.toLowerCase() === key);
}

/**
 * A short excerpt of the sentence around the first `[[targetTitle]]` in `content`,
 * used by the Backlinks pane. Link markup is kept so the UI can style it.
 */
export function buildBacklinkSnippet(content: string, targetTitle: string): string {
  const key = targetTitle.trim().toLowerCase();
  const masked = maskCode(content);

  for (const match of masked.matchAll(WIKI_LINK_PATTERN)) {
    if ((match[1] ?? '').trim().toLowerCase() !== key || match.index === undefined) {
      continue;
    }

    const linkStart = match.index;
    const linkEnd = linkStart + match[0].length;

    let start = linkStart;
    while (start > 0 && !/[.!?\n]/.test(content[start - 1] ?? '')) {
      start -= 1;
    }
    let end = linkEnd;
    while (end < content.length && !/[.!?\n]/.test(content[end] ?? '')) {
      end += 1;
    }
    if (end < content.length && content[end] !== '\n') {
      end += 1; // include the terminating punctuation
    }

    let from = start;
    let to = end;
    if (to - from > SNIPPET_MAX_LENGTH) {
      const budget = Math.max(SNIPPET_MAX_LENGTH - (linkEnd - linkStart), 0);
      from = Math.max(start, linkStart - Math.floor(budget / 2));
      to = Math.min(end, linkEnd + Math.ceil(budget / 2));
    }

    const body = content.slice(from, to).replace(/\s+/g, ' ').trim();
    return `${from > start ? '…' : ''}${body}${to < end ? '…' : ''}`;
  }
  return '';
}

