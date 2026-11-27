import { describe, expect, it } from 'vitest';
import { buildZipArchive } from '../../src/core/domain/services/zip-builder.service.js';
import { ZipReaderService } from '../../src/core/domain/services/zip-reader.service.js';

describe('ZipReaderService', () => {
  it('extracts markdown files from a PKZIP archive created by buildZipArchive', () => {
    const originalFiles = [
      {
        filename: 'Architecture.md',
        data: '# Clean Architecture\n\nPrinciples of domain layering.',
      },
      {
        filename: 'Daily Note.md',
        data: '# 2026-10-16\n- [ ] Task 1\n#daily-notes',
      },
    ];

    const zipBuffer = buildZipArchive(originalFiles);
    const extracted = ZipReaderService.extractMarkdownFiles(zipBuffer);

    expect(extracted).toHaveLength(2);
    expect(extracted.find((f) => f.filename === 'Architecture.md')?.content).toBe(
      originalFiles[0].data,
    );
    expect(extracted.find((f) => f.filename === 'Daily Note.md')?.content).toBe(
      originalFiles[1].data,
    );
  });

  it('ignores non-markdown files and corrupted headers gracefully', () => {
    const mixedFiles = [
      { filename: 'notes.txt', data: 'not markdown' },
      { filename: 'valid.md', data: '# Valid Note' },
    ];

    const zipBuffer = buildZipArchive(mixedFiles);
    const extracted = ZipReaderService.extractMarkdownFiles(zipBuffer);

    expect(extracted).toHaveLength(1);
    expect(extracted[0]?.filename).toBe('valid.md');

    // Corrupted buffer returns empty array without throwing
    const corrupted = Buffer.from('not a zip buffer at all');
    expect(ZipReaderService.extractMarkdownFiles(corrupted)).toEqual([]);
  });
});

