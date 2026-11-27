import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getGraphDataAction } from '@/features/graph/actions/graph.actions';
import { GraphCanvas } from '@/features/graph/components/GraphCanvas';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Knowledge Graph - BrainSync',
  description: 'Interactive 2D force-directed knowledge graph visualization',
};

export default async function GraphPage(): Promise<ReactNode> {
  const data = await getGraphDataAction();

  return (
    <div className="w-full h-full min-h-[calc(100vh-4rem)] md:min-h-screen">
      <GraphCanvas data={data} />
    </div>
  );
}

