/**
 * Domain-level errors thrown by the repository and auth layer. Route handlers
 * translate these into HTTP status codes (401 / 403 / 404), keeping the storage
 * and auth logic decoupled from the transport layer.
 */
export class UnauthorizedError extends Error {
  constructor(message = 'Not authenticated') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Not allowed') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
