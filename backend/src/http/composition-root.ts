import type { INoteRepository } from '../core/domain/repositories/note.repository.interface.js';
import type { ISearchRepository } from '../core/domain/repositories/search.repository.interface.js';
import type { ITagRepository } from '../core/domain/repositories/tag.repository.interface.js';
import { PrismaNoteRepository } from '../core/infrastructure/database/prisma-note.repository.js';
import { PrismaSearchRepository } from '../core/infrastructure/database/prisma-search.repository.js';
import { PrismaTagRepository } from '../core/infrastructure/database/prisma-tag.repository.js';
import { DeleteNoteUseCase } from '../core/use-cases/notes/delete-note.usecase.js';
import { FindNoteByTitleUseCase } from '../core/use-cases/notes/find-note-by-title.usecase.js';
import { GetNoteUseCase } from '../core/use-cases/notes/get-note.usecase.js';
import { ListNoteTitlesUseCase } from '../core/use-cases/notes/list-note-titles.usecase.js';
import { ListNotesUseCase } from '../core/use-cases/notes/list-notes.usecase.js';
import { SaveNoteUseCase } from '../core/use-cases/notes/save-note.usecase.js';
import { GlobalSearchUseCase } from '../core/use-cases/search/global-search.usecase.js';
import { GetNotesByTagUseCase } from '../core/use-cases/tags/get-notes-by-tag.usecase.js';
import { ListTagsUseCase } from '../core/use-cases/tags/list-tags.usecase.js';
import { GetGraphUseCase } from '../core/use-cases/graph/get-graph.usecase.js';
import { ExportVaultUseCase } from '../core/use-cases/export/export-vault.usecase.js';
import { ImportVaultUseCase } from '../core/use-cases/export/import-vault.usecase.js';
import { GetTasksUseCase } from '../core/use-cases/tasks/get-tasks.usecase.js';
import { ToggleTaskUseCase } from '../core/use-cases/tasks/toggle-task.usecase.js';
import { TogglePinNoteUseCase } from '../core/use-cases/notes/toggle-pin-note.usecase.js';

export interface Repositories {
  notes: INoteRepository;
  tags: ITagRepository;
  search: ISearchRepository;
}

export interface Container {
  saveNote: SaveNoteUseCase;
  getNote: GetNoteUseCase;
  listNotes: ListNotesUseCase;
  listNoteTitles: ListNoteTitlesUseCase;
  findNoteByTitle: FindNoteByTitleUseCase;
  deleteNote: DeleteNoteUseCase;
  listTags: ListTagsUseCase;
  getNotesByTag: GetNotesByTagUseCase;
  globalSearch: GlobalSearchUseCase;
  getGraph: GetGraphUseCase;
  exportVault: ExportVaultUseCase;
  getTasks: GetTasksUseCase;
  toggleTask: ToggleTaskUseCase;
  togglePinNote: TogglePinNoteUseCase;
  importVault: ImportVaultUseCase;
}

/**
 * Composition root: the only place that wires Use Cases to Infrastructure.
 * (In the original Next.js-only design this was done inside Server Actions.)
 */
export function createContainer(repositories?: Partial<Repositories>): Container {
  const notesRepo = repositories?.notes ?? new PrismaNoteRepository();
  const tagsRepo = repositories?.tags ?? new PrismaTagRepository();
  const searchRepo = repositories?.search ?? new PrismaSearchRepository();
  const saveNoteUseCase = new SaveNoteUseCase(notesRepo, tagsRepo);

  return {
    saveNote: saveNoteUseCase,
    getNote: new GetNoteUseCase(notesRepo, tagsRepo),
    listNotes: new ListNotesUseCase(notesRepo),
    listNoteTitles: new ListNoteTitlesUseCase(notesRepo),
    findNoteByTitle: new FindNoteByTitleUseCase(notesRepo),
    deleteNote: new DeleteNoteUseCase(notesRepo),
    listTags: new ListTagsUseCase(tagsRepo),
    getNotesByTag: new GetNotesByTagUseCase(tagsRepo),
    globalSearch: new GlobalSearchUseCase(searchRepo),
    getGraph: new GetGraphUseCase(notesRepo),
    exportVault: new ExportVaultUseCase(),
    getTasks: new GetTasksUseCase(notesRepo),
    toggleTask: new ToggleTaskUseCase(notesRepo, saveNoteUseCase),
    togglePinNote: new TogglePinNoteUseCase(notesRepo),
    importVault: new ImportVaultUseCase(notesRepo, saveNoteUseCase),
  };
}
