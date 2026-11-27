import type {
  BacklinkSource,
  LinkCandidate,
  Note,
  NoteInput,
  NoteSummary,
  NoteTitle,
} from '../../domain/entities/note.entity.js';
import type { GraphData, GraphNode } from '../../domain/entities/graph.entity.js';
import { ConflictError, NotFoundError } from '../../domain/errors/domain.errors.js';
import type { INoteRepository } from '../../domain/repositories/note.repository.interface.js';
import { Prisma } from './generated/client.js';
import { prisma } from './prisma.client.js';

const UNIQUE_VIOLATION = 'P2002';
const RECORD_NOT_FOUND = 'P2025';

function translateError(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === UNIQUE_VIOLATION) {
      return new ConflictError('A note with this title already exists');
    }
    if (error.code === RECORD_NOT_FOUND) {
      return new NotFoundError('Note not found');
    }
  }
  return error;
}

export class PrismaNoteRepository implements INoteRepository {
  async findById(id: string): Promise<Note | null> {
    return prisma.note.findUnique({ where: { id } });
  }

  async findByTitle(title: string): Promise<Note | null> {
    // lower(title) is backed by the unique index Note_title_lower_key.
    const rows = await prisma.$queryRaw<Note[]>`
      SELECT "id", "title", "content", "isPinned", "createdAt", "updatedAt"
      FROM "Note"
      WHERE lower("title") = lower(${title})
      LIMIT 1`;
    return rows[0] ?? null;
  }

  async findByTitles(titles: string[]): Promise<NoteTitle[]> {
    if (titles.length === 0) {
      return [];
    }
    const lowered = titles.map((title) => title.toLowerCase());
    return prisma.$queryRaw<NoteTitle[]>`
      SELECT "id", "title" FROM "Note" WHERE lower("title") = ANY(${lowered}::text[])`;
  }

  async listRecent(limit: number): Promise<NoteSummary[]> {
    return prisma.note.findMany({
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, isPinned: true, updatedAt: true },
      take: limit,
    });
  }

  async listTitles(): Promise<NoteTitle[]> {
    return prisma.note.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } });
  }

  async save(note: NoteInput, targetLinkIds: string[]): Promise<Note> {
    try {
      return await prisma.$transaction(async (tx) => {
        const saved =
          note.id === undefined
            ? await tx.note.create({
                data: {
                  title: note.title,
                  content: note.content,
                  ...(note.isPinned !== undefined ? { isPinned: note.isPinned } : {}),
                },
              })
            : await tx.note.update({
                where: { id: note.id },
                data: {
                  title: note.title,
                  content: note.content,
                  ...(note.isPinned !== undefined ? { isPinned: note.isPinned } : {}),
                },
              });

        const targets = [...new Set(targetLinkIds)].filter((id) => id !== saved.id);
        await tx.noteLink.deleteMany({ where: { sourceNoteId: saved.id } });
        if (targets.length > 0) {
          await tx.noteLink.createMany({
            data: targets.map((targetNoteId) => ({ sourceNoteId: saved.id, targetNoteId })),
          });
        }
        return saved;
      });
    } catch (error) {
      throw translateError(error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.note.delete({ where: { id } });
    } catch (error) {
      throw translateError(error);
    }
  }

  async findLinkCandidates(title: string, excludeId: string): Promise<LinkCandidate[]> {
    // Prisma escapes LIKE wildcards in `contains`, so titles with % or _ are safe.
    return prisma.note.findMany({
      where: { id: { not: excludeId }, content: { contains: `[[${title}`, mode: 'insensitive' } },
      select: { id: true, content: true },
    });
  }

  async replaceIncomingLinks(noteId: string, sourceIds: string[]): Promise<void> {
    const sources = [...new Set(sourceIds)].filter((id) => id !== noteId);
    await prisma.$transaction([
      prisma.noteLink.deleteMany({ where: { targetNoteId: noteId } }),
      prisma.noteLink.createMany({ data: sources.map((sourceNoteId) => ({ sourceNoteId, targetNoteId: noteId })) }),
    ]);
  }

  async findBacklinks(noteId: string): Promise<BacklinkSource[]> {
    const links = await prisma.noteLink.findMany({
      where: { targetNoteId: noteId },
      orderBy: { sourceNote: { updatedAt: 'desc' } },
      include: { sourceNote: { select: { id: true, title: true, content: true } } },
    });
    return links.map((link) => link.sourceNote);
  }

  async getGraphData(): Promise<GraphData> {
    const [nodes, links] = await Promise.all([
      prisma.$queryRaw<GraphNode[]>`
        SELECT n.id, n.title, COUNT(nl."sourceNoteId")::int AS "backlinkCount"
        FROM "Note" n
        LEFT JOIN "NoteLink" nl ON n.id = nl."targetNoteId"
        GROUP BY n.id, n.title
        ORDER BY n.title ASC
      `,
      prisma.noteLink.findMany({
        select: {
          sourceNoteId: true,
          targetNoteId: true,
        },
      }),
    ]);

    return {
      nodes,
      edges: links.map((l) => ({
        source: l.sourceNoteId,
        target: l.targetNoteId,
      })),
    };
  }

  async findNotesWithTasks(): Promise<Array<{ id: string; title: string; content: string }>> {
    return prisma.note.findMany({
      where: {
        OR: [
          { content: { contains: '- [' } },
          { content: { contains: '* [' } },
          { content: { contains: '+ [' } },
        ],
      },
      select: {
        id: true,
        title: true,
        content: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async togglePin(id: string, isPinned: boolean): Promise<Note> {
    try {
      return await prisma.note.update({
        where: { id },
        data: { isPinned },
      });
    } catch (error) {
      throw translateError(error);
    }
  }
}
