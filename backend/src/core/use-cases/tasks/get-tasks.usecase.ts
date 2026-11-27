import type { INoteRepository } from '../../domain/repositories/note.repository.interface.js';
import type { NoteTask, TaskListResult } from '../../domain/entities/task.entity.js';
import { TaskParserService } from '../../domain/services/task-parser.service.js';

export class GetTasksUseCase {
  constructor(private readonly noteRepository: INoteRepository) {}

  async execute(): Promise<TaskListResult> {
    const notes = await this.noteRepository.findNotesWithTasks();
    const tasks: NoteTask[] = [];

    for (const note of notes) {
      const extracted = TaskParserService.extractTasks(note.id, note.title, note.content);
      tasks.push(...extracted);
    }

    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      tasks,
      stats: {
        total,
        completed,
        pending,
        percentage,
      },
    };
  }
}

