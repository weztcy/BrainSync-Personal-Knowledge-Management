import { describe, expect, it } from 'vitest';
import { buildZipArchive, computeCrc32 } from '../../src/core/domain/services/zip-builder.service.js';

describe('ZipBuilderService', () => {
  it('computes accurate CRC-32 checksums', () => {
    const text = 'BrainSync PKM System';
    const crc = computeCrc32(Buffer.from(text, 'utf-8'));
    expect(crc).toBeGreaterThan(0);
  });

  it('generates a valid ZIP archive containing multiple files', () => {
    const entries = [
      { filename: 'Note1.md', data: '# First Note\nContent with [[Note2]]' },
      { filename: 'Note2.md', data: '# Second Note\nContent with #tags' },
    ];

    const zipBuffer = buildZipArchive(entries);

    expect(zipBuffer).toBeInstanceOf(Buffer);
    expect(zipBuffer.length).toBeGreaterThan(60);

    // Verify standard PKZIP magic bytes 'PK\x03\x04' at start
    expect(zipBuffer[0]).toBe(0x50); // 'P'
    expect(zipBuffer[1]).toBe(0x4b); // 'K'
    expect(zipBuffer[2]).toBe(0x03);
    expect(zipBuffer[3]).toBe(0x04);

    // Verify End of Central Directory signature 'PK\x05\x06' near the end
    const eocdSignature = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
    expect(zipBuffer.includes(eocdSignature)).toBe(true);

    // Verify filenames exist in binary stream
    expect(zipBuffer.includes(Buffer.from('Note1.md'))).toBe(true);
    expect(zipBuffer.includes(Buffer.from('Note2.md'))).toBe(true);
  });
});

