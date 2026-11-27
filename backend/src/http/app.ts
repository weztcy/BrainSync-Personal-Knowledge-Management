import Fastify, { type FastifyInstance } from 'fastify';
import { createContainer, type Container } from './composition-root.js';
import { errorHandler } from './error-handler.js';
import { registerNoteRoutes } from './routes/notes.routes.js';
import { registerSearchRoutes } from './routes/search.routes.js';
import { registerTagRoutes } from './routes/tags.routes.js';
import { registerGraphRoutes } from './routes/graph.routes.js';
import { registerExportRoutes } from './routes/export.routes.js';
import { registerTaskRoutes } from './routes/tasks.routes.js';
import { registerImportRoutes } from './routes/import.routes.js';

export interface BuildAppOptions {
  container?: Container;
  logger?: boolean;
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: options.logger ?? true });
  const container = options.container ?? createContainer();

  app.setErrorHandler(errorHandler);
  app.get('/health', async (): Promise<{ status: 'ok' }> => ({ status: 'ok' }));
  registerNoteRoutes(app, container);
  registerTagRoutes(app, container);
  registerSearchRoutes(app, container);
  registerGraphRoutes(app, container);
  registerExportRoutes(app, container);
  registerTaskRoutes(app, container);
  registerImportRoutes(app, container);

  return app;
}
