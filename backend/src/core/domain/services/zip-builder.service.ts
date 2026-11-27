/**
 * Zero-dependency pure TypeScript ZIP builder (PKZIP standard).
 * Builds standard uncompressed (Store) ZIP archives using native Node Buffers.
 * Fully compatible with Windows Explorer, macOS Archive Utility, and Linux unzip.
 */

// CRC-32 lookup table (IEEE 802.3)
const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC32_TABLE[i] = c;
}

export function computeCrc32(buffer: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i] ?? 0;
    const tableIndex = (crc ^ byte) & 0xff;
    const tableVal = CRC32_TABLE[tableIndex] ?? 0;
    crc = (crc >>> 8) ^ tableVal;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipEntry {
  filename: string;
  data: string | Uint8Array;
}

export function buildZipArchive(entries: ZipEntry[]): Buffer {
  const localHeaders: Buffer[] = [];
  const centralDirEntries: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const fileBytes = typeof entry.data === 'string' ? Buffer.from(entry.data, 'utf-8') : Buffer.from(entry.data);
    const filenameBytes = Buffer.from(entry.filename, 'utf-8');
    const crc = computeCrc32(fileBytes);
    const size = fileBytes.length;

    // Local file header (30 bytes + filename + data)
    const localHeader = Buffer.alloc(30 + filenameBytes.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // Local header signature 'PK\x03\x04'
    localHeader.writeUInt16LE(20, 4);         // Version needed (2.0)
    localHeader.writeUInt16LE(0, 6);          // General purpose bit flag
    localHeader.writeUInt16LE(0, 8);          // Compression method: 0 = Store
    localHeader.writeUInt16LE(0, 10);         // Last mod file time
    localHeader.writeUInt16LE(0, 12);         // Last mod file date
    localHeader.writeUInt32LE(crc, 14);        // CRC-32
    localHeader.writeUInt32LE(size, 18);       // Compressed size
    localHeader.writeUInt32LE(size, 22);       // Uncompressed size
    localHeader.writeUInt16LE(filenameBytes.length, 26); // Filename length
    localHeader.writeUInt16LE(0, 28);         // Extra field length
    filenameBytes.copy(localHeader, 30);

    localHeaders.push(localHeader);
    localHeaders.push(fileBytes);

    // Central directory header (46 bytes + filename)
    const cdHeader = Buffer.alloc(46 + filenameBytes.length);
    cdHeader.writeUInt32LE(0x02014b50, 0);     // Central directory signature 'PK\x01\x02'
    cdHeader.writeUInt16LE(20, 4);             // Version made by (2.0)
    cdHeader.writeUInt16LE(20, 6);             // Version needed to extract (2.0)
    cdHeader.writeUInt16LE(0, 8);              // General purpose bit flag
    cdHeader.writeUInt16LE(0, 10);             // Compression method: 0 = Store
    cdHeader.writeUInt16LE(0, 12);             // Last mod file time
    cdHeader.writeUInt16LE(0, 14);             // Last mod file date
    cdHeader.writeUInt32LE(crc, 16);           // CRC-32
    cdHeader.writeUInt32LE(size, 20);          // Compressed size
    cdHeader.writeUInt32LE(size, 24);          // Uncompressed size
    cdHeader.writeUInt16LE(filenameBytes.length, 28); // Filename length
    cdHeader.writeUInt16LE(0, 30);             // Extra field length
    cdHeader.writeUInt16LE(0, 32);             // File comment length
    cdHeader.writeUInt16LE(0, 34);             // Disk number start
    cdHeader.writeUInt16LE(0, 36);             // Internal file attributes
    cdHeader.writeUInt32LE(0, 38);             // External file attributes
    cdHeader.writeUInt32LE(offset, 42);        // Relative offset of local header
    filenameBytes.copy(cdHeader, 46);

    centralDirEntries.push(cdHeader);

    offset += localHeader.length + fileBytes.length;
  }

  const centralDirOffset = offset;
  const centralDirSize = centralDirEntries.reduce((sum, b) => sum + b.length, 0);

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);          // EOCD signature 'PK\x05\x06'
  eocd.writeUInt16LE(0, 4);                   // Number of this disk
  eocd.writeUInt16LE(0, 6);                   // Disk where central directory starts
  eocd.writeUInt16LE(entries.length, 8);      // Number of central directory records on this disk
  eocd.writeUInt16LE(entries.length, 10);     // Total number of central directory records
  eocd.writeUInt32LE(centralDirSize, 12);     // Size of central directory
  eocd.writeUInt32LE(centralDirOffset, 16);   // Offset of start of central directory
  eocd.writeUInt16LE(0, 20);                  // Comment length

  return Buffer.concat([...localHeaders, ...centralDirEntries, eocd]);
}

