import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { listTasksAction } from '@/features/tasks/actions/task.actions';
import { TaskDashboard } from '@/features/tasks/components/TaskDashboard';

export const metadata: Metadata = {
  title: 'Task Dashboard - BrainSync',
  description: 'Manage all markdown checklist tasks across your vault.',
};

export const dynamic = 'force-dynamic';

export default async function TasksPage(): Promise<ReactNode> {
  const result = await listTasksAction();

  return (
    <TaskDashboard
      initialTasks={result.tasks}
      initialStats={result.stats}
    />
  );
}

