import { describe, expect, it } from 'vitest';
import { GetGraphUseCase } from '../../src/core/use-cases/graph/get-graph.usecase.js';
import type { INoteRepository } from '../../src/core/domain/repositories/note.repository.interface.js';
import type { GraphData } from '../../src/core/domain/entities/graph.entity.js';

describe('GetGraphUseCase', () => {
  it('returns graph nodes and edges from repository', async () => {
    const mockGraphData: GraphData = {
      nodes: [
        { id: '1', title: 'Note 1', backlinkCount: 1 },
        { id: '2', title: 'Note 2', backlinkCount: 0 },
      ],
      edges: [{ source: '2', target: '1' }],
    };

    const mockRepo: Partial<INoteRepository> = {
      getGraphData: async () => mockGraphData,
    };

    const useCase = new GetGraphUseCase(mockRepo as INoteRepository);
    const result = await useCase.execute();

    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]?.source).toBe('2');
    expect(result.edges[0]?.target).toBe('1');
  });
});

