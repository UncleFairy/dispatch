import type { MessagesQuery, StoredMessage } from '@/lib/schemas';

/**
 * Pure, side-effect-free feed selection: filtering, newest-first ordering, and
 * cursor pagination over an in-memory array. Kept separate from the file-backed
 * repository so this logic (the trickiest part of the data layer) can be unit
 * tested without any I/O, `globalThis` state, or `server-only` constraints.
 */

// Newest-first, with a stable id tiebreak so paging never skips/duplicates a row
// when two messages share a timestamp. ISO strings from toISOString() are
// fixed-length UTC, so lexical comparison equals chronological comparison.
export function compareDesc(a: StoredMessage, b: StoredMessage): number {
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1;
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

/** Opaque cursor encoding the last item's (createdAt, id). */
export function encodeCursor(m: StoredMessage): string {
  return Buffer.from(`${m.createdAt}|${m.id}`).toString('base64url');
}

export function decodeCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    const [createdAt, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|');
    if (!createdAt || !id) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

// In descending order, an item sits *after* the cursor if it's strictly older,
// or the same instant but a smaller id.
export function isAfterCursor(
  m: StoredMessage,
  cur: { createdAt: string; id: string },
): boolean {
  if (m.createdAt !== cur.createdAt) return m.createdAt < cur.createdAt;
  return m.id < cur.id;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// A date-only string (from a <input type="date">, e.g. "2026-07-15") parses
// as UTC midnight at the *start* of that day. Used as-is that makes a poor
// upper bound — "to 2026-07-15" would exclude the entire day it names.
// Advance it to one tick before the next day so the whole day is included.
function toUpperBound(dateStr: string): number {
  const t = Date.parse(dateStr);
  return DATE_ONLY.test(dateStr) ? t + 24 * 60 * 60 * 1000 - 1 : t;
}

/** True if a message passes the tag / user / date-range filters. */
export function matchesFilters(m: StoredMessage, query: MessagesQuery): boolean {
  if (query.tag && m.tag !== query.tag) return false;
  if (query.userId && m.authorId !== query.userId) return false;
  if (query.from || query.to) {
    const t = Date.parse(m.createdAt);
    if (query.from && t < Date.parse(query.from)) return false;
    if (query.to && t > toUpperBound(query.to)) return false;
  }
  return true;
}

/**
 * Filter → sort → apply cursor → take one page. Returns the stored rows plus the
 * `nextCursor` (null when the last page has been reached). Fetching `limit + 1`
 * conceptually — we look at whether anything remains after the slice — tells us
 * if there's a next page without a second pass.
 */
export function selectPage(
  messages: StoredMessage[],
  query: MessagesQuery,
): { items: StoredMessage[]; nextCursor: string | null } {
  let rows = messages.filter((m) => matchesFilters(m, query));
  rows.sort(compareDesc);

  if (query.cursor) {
    const cur = decodeCursor(query.cursor);
    if (cur) rows = rows.filter((m) => isAfterCursor(m, cur));
  }

  const page = rows.slice(0, query.limit);
  const hasMore = rows.length > query.limit;
  const nextCursor = hasMore ? encodeCursor(page[page.length - 1]) : null;
  return { items: page, nextCursor };
}
