'use client';

import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  Layers,
  ListTodo,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useOptimistic, useState, useTransition, type ReactNode } from 'react';
import { toggleTaskAction } from '../actions/task.actions';
import { cn } from '@/shared/lib/cn';
import type { NoteTask, TaskStats } from '@/shared/types';

interface TaskDashboardProps {
  initialTasks: NoteTask[];
  initialStats?: TaskStats;
}

type FilterStatus = 'all' | 'pending' | 'completed';
type ViewMode = 'grouped' | 'flat';

export function TaskDashboard({ initialTasks }: TaskDashboardProps): ReactNode {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const [tasks, setOptimisticTask] = useOptimistic(
    initialTasks,
    (state, { taskId, completed }: { taskId: string; completed: boolean }) =>
      state.map((t) => (t.id === taskId ? { ...t, completed } : t)),
  );

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, percentage };
  }, [tasks]);

  const handleToggle = (task: NoteTask) => {
    const nextCompleted = !task.completed;

    startTransition(async () => {
      setOptimisticTask({ taskId: task.id, completed: nextCompleted });
      await toggleTaskAction(task.noteId, task.lineIndex, nextCompleted);
    });
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter === 'pending' && t.completed) return false;
      if (statusFilter === 'completed' && !t.completed) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesText = t.text.toLowerCase().includes(query);
        const matchesNote = t.noteTitle.toLowerCase().includes(query);
        return matchesText || matchesNote;
      }

      return true;
    });
  }, [tasks, statusFilter, searchQuery]);

  const groupedTasks = useMemo(() => {
    const groups = new Map<string, { noteId: string; noteTitle: string; tasks: NoteTask[] }>();

    for (const task of filteredTasks) {
      const group = groups.get(task.noteId) ?? {
        noteId: task.noteId,
        noteTitle: task.noteTitle,
        tasks: [],
      };
      group.tasks.push(task);
      groups.set(task.noteId, group);
    }

    return Array.from(groups.values());
  }, [filteredTasks]);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50/50 dark:bg-slate-950 px-4 py-8 sm:px-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <ListTodo className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
              Task Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Aggregated checklist items across your personal knowledge vault.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Tasks
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {stats.total}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
              Pending
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {stats.pending}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
              Completed
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {stats.completed}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {stats.total > 0 && (
        <div className="mb-8 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium mb-2">
            <span className="text-slate-600 dark:text-slate-400">Vault Task Completion</span>
            <span className="text-slate-900 dark:text-slate-100 font-bold">{stats.percentage}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300 rounded-full"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 self-start">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
            )}
          >
            All ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              statusFilter === 'pending'
                ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
            )}
          >
            Pending ({stats.pending})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              statusFilter === 'completed'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
            )}
          >
            Completed ({stats.completed})
          </button>
        </div>

        {/* View Mode & Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 bg-slate-100 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                viewMode === 'grouped'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
              )}
              title="Group by Note"
            >
              Grouped
            </button>
            <button
              type="button"
              onClick={() => setViewMode('flat')}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                viewMode === 'flat'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
              )}
              title="Flat List"
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Task Content */}
      {filteredTasks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            No tasks match your filter
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'Try adjusting your search query or reset status filters.'
              : 'Add markdown checkboxes (- [ ]) to any note or daily note to track them here.'}
          </p>
        </div>
      ) : viewMode === 'grouped' ? (
        <div className="space-y-6">
          {groupedTasks.map((group) => (
            <div
              key={group.noteId}
              className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden"
            >
              {/* Group Header */}
              <div className="px-4 py-3 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <Link
                  href={`/note/${group.noteId}`}
                  className="flex items-center gap-2 group text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                >
                  <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="truncate">{group.noteTitle}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                </Link>
                <span className="text-[11px] bg-slate-200/80 dark:bg-slate-800 px-2 py-0.5 rounded-full font-mono text-slate-500">
                  {group.tasks.filter((t) => t.completed).length} / {group.tasks.length}
                </span>
              </div>

              {/* Tasks in Note */}
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {group.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={() => handleToggle(task)}
                    isPending={isPending}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                showOriginNote
                onToggle={() => handleToggle(task)}
                isPending={isPending}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface TaskRowProps {
  task: NoteTask;
  showOriginNote?: boolean;
  onToggle: () => void;
  isPending: boolean;
}

function TaskRow({ task, showOriginNote, onToggle }: TaskRowProps): ReactNode {
  return (
    <li className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors group">
      <button
        type="button"
        onClick={onToggle}
        className="mt-0.5 shrink-0 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
        aria-label={task.completed ? 'Mark task as incomplete' : 'Mark task as complete'}
      >
        {task.completed ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        ) : (
          <Circle className="w-4 h-4 hover:stroke-blue-500 transition-colors" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <span
          className={cn(
            'text-sm leading-snug break-words transition-colors',
            task.completed
              ? 'line-through text-slate-400 dark:text-slate-500'
              : 'text-slate-800 dark:text-slate-200 font-normal',
          )}
        >
          {task.text || <span className="italic text-slate-400">Untitled item</span>}
        </span>

        {showOriginNote && (
          <div className="mt-1">
            <Link
              href={`/note/${task.noteId}`}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              <CalendarDays className="w-3 h-3" />
              <span>{task.noteTitle}</span>
            </Link>
          </div>
        )}
      </div>
    </li>
  );
}

