import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { ConflictError, NotFoundError, ValidationError } from '../core/domain/errors/domain.errors.js';

interface ErrorBody {
  error: string;
}

export function errorHandler(error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply): void {
  if (error instanceof NotFoundError) {
    void reply.status(404).send({ error: error.message } satisfies ErrorBody);
    return;
  }
  if (error instanceof ConflictError) {
    void reply.status(409).send({ error: error.message } satisfies ErrorBody);
    return;
  }
  if (error instanceof ValidationError) {
    void reply.status(400).send({ error: error.message } satisfies ErrorBody);
    return;
  }
  if (error instanceof ZodError) {
    const message = error.issues.map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`).join('; ');
    void reply.status(400).send({ error: message } satisfies ErrorBody);
    return;
  }

  request.log.error(error);
  const status = 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500;
  void reply.status(status).send({ error: status >= 500 ? 'Internal server error' : error.message } satisfies ErrorBody);
}

