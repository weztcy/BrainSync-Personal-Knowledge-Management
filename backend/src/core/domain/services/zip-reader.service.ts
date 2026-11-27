import { inflateRawSync } from 'node:zlib';

export interface ExtractedFile {
  filename: string;
  content: string;
}

/**
 * Standard PKZIP binary reader with zero external dependencies.
 * Uses native Node.js Buffer and built-in node:zlib for DEFLATE decompression.
 */
export class ZipReaderService {
  private static readonly LOCAL_FILE_HEADER_SIG = 0x04034b50; // 'PK\x03\x04'

  /**
   * Parses a zip buffer and extracts all `.md` files.
   */
  static extractMarkdownFiles(buffer: Buffer): ExtractedFile[] {
    const files: ExtractedFile[] = [];
    let offset = 0;

    while (offset + 30 <= buffer.length) {
      const signature = buffer.readUInt32LE(offset);

      // Stop when we reach Central Directory ('PK\x01\x02') or End of Central Directory
      if (signature !== this.LOCAL_FILE_HEADER_SIG) {
        break;
      }

      const compressionMethod = buffer.readUInt16LE(offset + 8);
      const compressedSize = buffer.readUInt32LE(offset + 18);
      const filenameLength = buffer.readUInt16LE(offset + 26);
      const extraFieldLength = buffer.readUInt16LE(offset + 28);

      const filenameStart = offset + 30;
      const filenameEnd = filenameStart + filenameLength;
      const filename = buffer.toString('utf8', filenameStart, filenameEnd);

      const dataStart = filenameEnd + extraFieldLength;
      const dataEnd = dataStart + compressedSize;

      if (dataEnd > buffer.length) {
        break;
      }

      // We only care about .md files (ignore directories and system files like __MACOSX)
      if (
        filename.toLowerCase().endsWith('.md') &&
        !filename.startsWith('__MACOSX') &&
        !filename.includes('/.')
      ) {
        const compressedData = buffer.subarray(dataStart, dataEnd);
        let content = '';

        if (compressionMethod === 0) {
          // Stored (no compression)
          content = compressedData.toString('utf8');
        } else if (compressionMethod === 8) {
          // Deflated
          try {
            content = inflateRawSync(compressedData).toString('utf8');
          } catch {
            content = compressedData.toString('utf8');
          }
        }

        // Clean basename (e.g. "path/to/Note.md" -> "Note.md")
        const basename = filename.split('/').pop()?.split('\\').pop() ?? filename;

        files.push({
          filename: basename,
          content,
        });
      }

      offset = dataEnd;
    }

    return files;
  }
}

