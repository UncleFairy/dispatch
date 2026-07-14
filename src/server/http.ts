import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '@/server/errors';

/**
 * Small helpers for consistent JSON responses and one place that maps thrown
 * domain errors to HTTP status codes, so every route handler stays a thin,
 * uniform try/catch.
 */
export function json<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

/** 400 with a compact, client-friendly list of validation issues. */
export function badRequest(error: ZodError): NextResponse {
  return NextResponse.json(
    {
      error: 'Invalid request',
      issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    },
    { status: 400 },
  );
}

export function handleError(err: unknown): NextResponse {
  if (err instanceof UnauthorizedError)
    return NextResponse.json({ error: err.message }, { status: 401 });
  if (err instanceof ForbiddenError)
    return NextResponse.json({ error: err.message }, { status: 403 });
  if (err instanceof NotFoundError)
    return NextResponse.json({ error: err.message }, { status: 404 });
  console.error('[api] unhandled error', err);
  return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
}
