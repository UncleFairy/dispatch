/**
 * Domain-level errors thrown by the repository. Route handlers translate these
 * into HTTP status codes (404 / 403), keeping storage logic decoupled from the
 * transport layer.
 */
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
