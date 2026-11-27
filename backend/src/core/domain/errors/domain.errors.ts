/** Base class so the HTTP layer can map domain failures to status codes without knowing HTTP here. */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {}

export class ValidationError extends DomainError {}

export class ConflictError extends DomainError {}

