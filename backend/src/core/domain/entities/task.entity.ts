export interface NoteTask {
  id: string; // format: `${noteId}:${lineIndex}`
  noteId: string;
  noteTitle: string;
  lineIndex: number;
  text: string;
  completed: boolean;
  rawLine: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  percentage: number;
}

export interface TaskListResult {
  tasks: NoteTask[];
  stats: TaskStats;
}

export interface ToggleTaskInput {
  noteId: string;
  lineIndex: number;
  completed: boolean;
}

