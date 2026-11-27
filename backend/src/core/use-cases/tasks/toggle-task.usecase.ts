import type { INoteRepository } from '../../domain/repositories/note.repository.interface.js';
import type { NoteTask, ToggleTaskInput } from '../../domain/entities/task.entity.js';
import { NotFoundError } from '../../domain/errors/domain.errors.js';
import { TaskParserService } from '../../domain/services/task-parser.service.js';
import type { SaveNoteUseCase } from '../notes/save-note.usecase.js';

export interface ToggleTaskResult {
  success: boolean;
  task?: NoteTask;
}

export class ToggleTaskUseCase {
  constructor(
    private readonly noteRepository: INoteRepository,
    private readonly saveNoteUseCase: SaveNoteUseCase,
  ) {}

  async execute(input: ToggleTaskInput): Promise<ToggleTaskResult> {
    const note = await this.noteRepository.findById(input.noteId);
    if (!note) {
      throw new NotFoundError(`Note ${input.noteId} not found`);
    }

    const updatedContent = TaskParserService.toggleTaskLine(
      note.content,
      input.lineIndex,
      input.completed,
    );

    await this.saveNoteUseCase.execute({
      id: note.id,
      title: note.title,
      content: updatedContent,
    });

    const tasks = TaskParserService.extractTasks(note.id, note.title, updatedContent);
    const updatedTask = tasks.find((t) => t.lineIndex === input.lineIndex);

    return {
      success: true,
      task: updatedTask,
    };
  }
}

