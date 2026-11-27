export interface Env {
  readonly port: number;
  readonly host: string;
  readonly databaseUrl: string;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function loadEnv(): Env {
  const port = Number(process.env['PORT'] ?? 4000);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('PORT must be a positive integer');
  }

  return {
    port,
    host: process.env['HOST'] ?? '0.0.0.0',
    databaseUrl: required('DATABASE_URL'),
  };
}

