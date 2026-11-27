import type { NoteTask } from '../entities/task.entity.js';

const TASK_REGEX = /^(\s*[-*+]\s*\[)([ xX])(\]\s*(.*))$/;

export class TaskParserService {
  /**
   * Extracts all task list items (`- [ ]` and `- [x]`) from the note content.
   */
  static extractTasks(noteId: string, noteTitle: string, content: string): NoteTask[] {
    if (!content) return [];

    const lines = content.split(/\r?\n/);
    const tasks: NoteTask[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (typeof line !== 'string') continue;

      const match = TASK_REGEX.exec(line);
      if (match && match[1] !== undefined && match[2] !== undefined && match[4] !== undefined) {
        const isCompleted = match[2].toLowerCase() === 'x';
        const taskText = match[4].trim();

        tasks.push({
          id: `${noteId}:${i}`,
          noteId,
          noteTitle,
          lineIndex: i,
          text: taskText,
          completed: isCompleted,
          rawLine: line,
        });
      }
    }

    return tasks;
  }

  /**
   * Toggles the checkbox on a specific line index of the note content.
   * Returns the new content string.
   */
  static toggleTaskLine(content: string, lineIndex: number, completed: boolean): string {
    const lines = content.split(/\r?\n/);

    if (lineIndex < 0 || lineIndex >= lines.length) {
      throw new Error(`Line index ${lineIndex} is out of bounds (total lines: ${lines.length})`);
    }

    const targetLine = lines[lineIndex];
    if (typeof targetLine !== 'string') {
      throw new Error(`Line index ${lineIndex} is out of bounds (total lines: ${lines.length})`);
    }

    const match = TASK_REGEX.exec(targetLine);
    if (!match || match[1] === undefined || match[3] === undefined) {
      throw new Error(`Line ${lineIndex} is not a valid markdown task checkbox: "${targetLine}"`);
    }

    const newCheckChar = completed ? 'x' : ' ';
    const updatedLine = `${match[1]}${newCheckChar}${match[3]}`;

    lines[lineIndex] = updatedLine;
    return lines.join('\n');
  }
}

