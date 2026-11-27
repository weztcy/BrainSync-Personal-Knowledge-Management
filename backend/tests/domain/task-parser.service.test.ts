import { describe, expect, it } from 'vitest';
import { TaskParserService } from '../../src/core/domain/services/task-parser.service.js';

describe('TaskParserService', () => {
  const sampleContent = `# My Daily Note

### Tasks & Priorities
- [ ] Implement global task dashboard
- [x] Complete daily notes feature
- [X] Split editor mode toggle
  - [ ] Subtask indented item

### Other Notes
Normal bullet point:
- Not a task checkbox
`;

  it('extracts all tasks with correct state, text, and line index', () => {
    const tasks = TaskParserService.extractTasks('note-1', 'Daily 2026-10-16', sampleContent);

    expect(tasks).toHaveLength(4);

    expect(tasks[0]).toEqual({
      id: 'note-1:3',
      noteId: 'note-1',
      noteTitle: 'Daily 2026-10-16',
      lineIndex: 3,
      text: 'Implement global task dashboard',
      completed: false,
      rawLine: '- [ ] Implement global task dashboard',
    });

    expect(tasks[1].completed).toBe(true);
    expect(tasks[1].text).toBe('Complete daily notes feature');

    expect(tasks[2].completed).toBe(true);
    expect(tasks[2].text).toBe('Split editor mode toggle');

    expect(tasks[3].completed).toBe(false);
    expect(tasks[3].text).toBe('Subtask indented item');
  });

  it('toggles a pending task to completed', () => {
    const updated = TaskParserService.toggleTaskLine(sampleContent, 3, true);
    expect(updated).toContain('- [x] Implement global task dashboard');

    const reparsed = TaskParserService.extractTasks('note-1', 'Daily', updated);
    expect(reparsed[0].completed).toBe(true);
  });

  it('toggles a completed task back to pending', () => {
    const updated = TaskParserService.toggleTaskLine(sampleContent, 4, false);
    expect(updated).toContain('- [ ] Complete daily notes feature');

    const reparsed = TaskParserService.extractTasks('note-1', 'Daily', updated);
    expect(reparsed[1].completed).toBe(false);
  });

  it('throws error when toggling out of bounds or non-checkbox line', () => {
    expect(() => TaskParserService.toggleTaskLine(sampleContent, 999, true)).toThrow(
      /out of bounds/,
    );
    expect(() => TaskParserService.toggleTaskLine(sampleContent, 0, true)).toThrow(
      /not a valid markdown task checkbox/,
    );
  });
});

