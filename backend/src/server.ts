import { loadEnv } from './config/env.js';
import { prisma } from './core/infrastructure/database/prisma.client.js';
import { buildApp } from './http/app.js';

async function main(): Promise<void> {
  const env = loadEnv();
  const app = buildApp();

  const shutdown = async (): Promise<void> => {
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await app.listen({ port: env.port, host: env.host });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
