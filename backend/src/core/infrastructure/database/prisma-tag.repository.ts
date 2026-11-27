import type { NoteSummary } from '../../domain/entities/note.entity.js';
import type { TagWithCount } from '../../domain/entities/tag.entity.js';
import type { ITagRepository } from '../../domain/repositories/tag.repository.interface.js';
import { prisma } from './prisma.client.js';

export class PrismaTagRepository implements ITagRepository {
  async listAllWithCount(): Promise<TagWithCount[]> {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { notes: true },
        },
      },
    });

    return tags
      .filter((tag) => tag._count.notes > 0)
      .map((tag) => ({
        id: tag.id,
        name: tag.name,
        noteCount: tag._count.notes,
      }));
  }

  async findNotesByTagName(name: string): Promise<NoteSummary[]> {
    const noteTags = await prisma.noteTag.findMany({
      where: {
        tag: { name: name.toLowerCase() },
      },
      include: {
        note: {
          select: { id: true, title: true, isPinned: true, updatedAt: true },
        },
      },
      orderBy: {
        note: { updatedAt: 'desc' },
      },
    });

    return noteTags.map((nt) => nt.note);
  }

  async syncTags(noteId: string, inlineTags: string[], manualTags?: string[]): Promise<string[]> {
    const normalizedInline = [...new Set(inlineTags.map((t) => t.toLowerCase().trim()))].filter((t) => t.length > 0);
    const normalizedManual = manualTags
      ? [...new Set(manualTags.map((t) => t.toLowerCase().trim()))].filter((t) => t.length > 0)
      : undefined;

    return await prisma.$transaction(async (tx) => {
      // 1. If manualTags specified, replace existing MANUAL NoteTags
      if (normalizedManual !== undefined) {
        await tx.noteTag.deleteMany({
          where: { noteId, source: 'MANUAL' },
        });
      }

      // 2. Always replace INLINE NoteTags with fresh ones
      await tx.noteTag.deleteMany({
        where: { noteId, source: 'INLINE' },
      });

      // 3. Collect all tags to ensure they exist in DB
      const existingManual =
        normalizedManual === undefined
          ? (
              await tx.noteTag.findMany({
                where: { noteId, source: 'MANUAL' },
                include: { tag: true },
              })
            ).map((nt) => nt.tag.name)
          : normalizedManual;

      const allTagNames = [...new Set([...normalizedInline, ...existingManual])];
      if (allTagNames.length === 0) {
        return [];
      }

      // Upsert tags that don't exist yet
      const existingTags = await tx.tag.findMany({
        where: { name: { in: allTagNames } },
      });
      const existingNames = new Set(existingTags.map((t) => t.name));
      const missingNames = allTagNames.filter((name) => !existingNames.has(name));

      if (missingNames.length > 0) {
        await tx.tag.createMany({
          data: missingNames.map((name) => ({ name })),
          skipDuplicates: true,
        });
      }

      // Re-fetch all tag records to get their IDs
      const allTags = await tx.tag.findMany({
        where: { name: { in: allTagNames } },
      });
      const tagMap = new Map(allTags.map((t) => [t.name, t.id]));

      // 4. Insert MANUAL tags if specified
      if (normalizedManual !== undefined) {
        const manualRows = normalizedManual
          .map((name) => tagMap.get(name))
          .filter((id): id is string => id !== undefined)
          .map((tagId) => ({ noteId, tagId, source: 'MANUAL' as const }));

        if (manualRows.length > 0) {
          await tx.noteTag.createMany({
            data: manualRows,
            skipDuplicates: true,
          });
        }
      }

      // 5. Insert INLINE tags (skip if already marked MANUAL on this note)
      const manualTagSet = new Set(existingManual);
      const inlineOnly = normalizedInline.filter((name) => !manualTagSet.has(name));
      const inlineRows = inlineOnly
        .map((name) => tagMap.get(name))
        .filter((id): id is string => id !== undefined)
        .map((tagId) => ({ noteId, tagId, source: 'INLINE' as const }));

      if (inlineRows.length > 0) {
        await tx.noteTag.createMany({
          data: inlineRows,
          skipDuplicates: true,
        });
      }

      return allTagNames.sort();
    });
  }

  async getTagsForNote(noteId: string): Promise<string[]> {
    const noteTags = await prisma.noteTag.findMany({
      where: { noteId },
      include: { tag: { select: { name: true } } },
      orderBy: { tag: { name: 'asc' } },
    });
    return noteTags.map((nt) => nt.tag.name);
  }
}

