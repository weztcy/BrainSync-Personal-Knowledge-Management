const SNIPPET_TARGET_LENGTH = 120;

/**
 * Extracts a concise snippet centered around the match in content.
 */
export function buildSearchSnippet(content: string, query: string): string {
  if (!content || !query) {
    return '';
  }

  const cleanContent = content.replace(/\s+/g, ' ').trim();
  const lowerContent = cleanContent.toLowerCase();
  const lowerQuery = query.toLowerCase();

  const matchIndex = lowerContent.indexOf(lowerQuery);
  if (matchIndex === -1) {
    // Return first N chars if query wasn't an exact substring (e.g. fuzzy match)
    if (cleanContent.length <= SNIPPET_TARGET_LENGTH) {
      return cleanContent;
    }
    return `${cleanContent.slice(0, SNIPPET_TARGET_LENGTH).trim()}…`;
  }

  const half = Math.floor((SNIPPET_TARGET_LENGTH - query.length) / 2);
  let start = Math.max(0, matchIndex - half);
  let end = Math.min(cleanContent.length, matchIndex + query.length + half);

  // Expand to word boundaries if possible
  if (start > 0) {
    const spaceBefore = cleanContent.lastIndexOf(' ', start);
    if (spaceBefore !== -1 && spaceBefore >= start - 15) {
      start = spaceBefore + 1;
    }
  }
  if (end < cleanContent.length) {
    const spaceAfter = cleanContent.indexOf(' ', end);
    if (spaceAfter !== -1 && spaceAfter <= end + 15) {
      end = spaceAfter;
    }
  }

  const prefix = start > 0 ? '…' : '';
  const suffix = end < cleanContent.length ? '…' : '';
  return `${prefix}${cleanContent.slice(start, end).trim()}${suffix}`;
}

