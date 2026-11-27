import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client.js';

function createPrismaClient(): PrismaClient {
  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) {
    throw new Error('Missing required environment variable: DATABASE_URL');
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

// Reuse one client (and its connection pool) per process.
export const prisma: PrismaClient = createPrismaClient();

