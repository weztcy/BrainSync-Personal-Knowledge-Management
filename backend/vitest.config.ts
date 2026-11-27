import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    env: {
      // The Prisma client is created at import time but never connects in unit tests.
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    },
  },
});

