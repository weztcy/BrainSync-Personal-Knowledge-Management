import { describe, expect, it } from 'vitest';
import { extractHashTags, normalizeTagNames } from '../../src/core/domain/services/tag-parser.service.js';

describe('extractHashTags', () => {
  it('extracts hashtags from text, normalizes to lowercase and deduplicates', () => {
    const text = 'Exploring #React and #TypeScript, also #react and #State-Management!';
    expect(extractHashTags(text)).toEqual(['react', 'typescript', 'state-management']);
  });

  it('ignores Markdown headings', () => {
    const text = [
      '# Main Heading',
      '## Sub Heading',
      '### Another Heading',
      'Valid #tag-here in paragraph',
    ].join('\n');
    expect(extractHashTags(text)).toEqual(['tag-here']);
  });

  it('ignores hashtags inside inline code and fenced code blocks', () => {
    const text = [
      'Code: `#hidden-tag`',
      '```',
      '#ignore-in-block',
      '```',
      'Real tag: #visible-tag',
    ].join('\n');
    expect(extractHashTags(text)).toEqual(['visible-tag']);
  });

  it('ignores URLs and HTML anchors containing hash', () => {
    const text = 'Check https://example.com/page#anchor and [link](https://test.com#ref) and #real';
    expect(extractHashTags(text)).toEqual(['real']);
  });

  it('ignores pure issue numbers like #123', () => {
    const text = 'Fixed in #42 and #1099, related to #bug-fix';
    expect(extractHashTags(text)).toEqual(['bug-fix']);
  });
});

describe('normalizeTagNames', () => {
  it('strips leading hashes, trims, lowercases and filters out invalid names', () => {
    expect(normalizeTagNames(['#React', '  #node-js  ', '123', '', '  ', 'valid_tag'])).toEqual([
      'react',
      'node-js',
      'valid_tag',
    ]);
  });
});

