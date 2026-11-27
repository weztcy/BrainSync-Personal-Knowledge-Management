import { describe, expect, it } from 'vitest';
import {
  buildBacklinkSnippet,
  extractWikiLinks,
  linksToTitle,
  maskCode,
} from '../../src/core/domain/services/link-parser.service.js';

describe('extractWikiLinks', () => {
  it('extracts unique titles in order, ignoring case duplicates', () => {
    const text = 'See [[React Context]] and [[State Management]], again [[react context]].';
    expect(extractWikiLinks(text)).toEqual(['React Context', 'State Management']);
  });

  it('trims whitespace inside brackets and skips empty links', () => {
    expect(extractWikiLinks('[[  Padded  ]] [[ ]] [[]]')).toEqual(['Padded']);
  });

  it('ignores links inside inline code and fenced code blocks', () => {
    const text = ['Use `[[inline]]` here', '```md', '[[fenced]]', '```', 'Real [[Visible]]'].join('\n');
    expect(extractWikiLinks(text)).toEqual(['Visible']);
  });

  it('handles an unterminated fence by masking until the end', () => {
    expect(extractWikiLinks('[[Before]]\n```\n[[Hidden]]')).toEqual(['Before']);
  });

  it('does not match across lines or nested brackets', () => {
    expect(extractWikiLinks('[[broken\nlink]] [[a [b]] c]]')).toEqual([]);
  });
});

describe('maskCode', () => {
  it('preserves length so offsets stay valid', () => {
    const text = 'a `code` b\n```js\nx\n```\nc';
    expect(maskCode(text)).toHaveLength(text.length);
  });
});

describe('linksToTitle', () => {
  it('matches ignoring case and ignores code', () => {
    expect(linksToTitle('x [[Foo Bar]] y', 'foo bar')).toBe(true);
    expect(linksToTitle('`[[Foo Bar]]`', 'Foo Bar')).toBe(false);
  });
});

describe('buildBacklinkSnippet', () => {
  it('returns the sentence that contains the link', () => {
    const content = 'First sentence. I learned about [[React Context]] today! Last one.';
    expect(buildBacklinkSnippet(content, 'react context')).toBe('I learned about [[React Context]] today!');
  });

  it('truncates very long sentences around the link with ellipses', () => {
    const content = `${'word '.repeat(60)}[[Target]] ${'tail '.repeat(60)}`;
    const snippet = buildBacklinkSnippet(content, 'Target');
    expect(snippet).toContain('[[Target]]');
    expect(snippet.length).toBeLessThan(200);
    expect(snippet.startsWith('…')).toBe(true);
    expect(snippet.endsWith('…')).toBe(true);
  });

  it('returns an empty string when the link is absent', () => {
    expect(buildBacklinkSnippet('nothing here', 'Target')).toBe('');
  });
});

