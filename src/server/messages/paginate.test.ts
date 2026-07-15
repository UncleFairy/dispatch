import { describe, it, expect } from 'vitest';
import {
  selectPage,
  encodeCursor,
  decodeCursor,
  matchesFilters,
} from '@/server/messages/paginate';
import type { MessagesQuery, StoredMessage } from '@/lib/schemas';

/** Build a StoredMessage with sensible defaults; only id + createdAt matter here. */
function msg(
  partial: Partial<StoredMessage> & Pick<StoredMessage, 'id' | 'createdAt'>,
): StoredMessage {
  return {
    authorId: 'u_ada',
    body: 'hello',
    tag: 'PRODUCT',
    updatedAt: partial.createdAt,
    ...partial,
  };
}

/** Minutes-past a fixed instant → ISO, so timestamps are readable + deterministic. */
const at = (min: number) => new Date(Date.UTC(2026, 0, 1, 0, min, 0)).toISOString();

const q = (over: Partial<MessagesQuery>): MessagesQuery => ({ limit: 20, ...over });

const data: StoredMessage[] = [
  msg({ id: 'a', createdAt: at(10), tag: 'PRODUCT', authorId: 'u_ada' }),
  msg({ id: 'b', createdAt: at(9), tag: 'DESIGN', authorId: 'u_marco' }),
  msg({ id: 'c', createdAt: at(8), tag: 'PRODUCT', authorId: 'u_ada' }),
  msg({ id: 'd', createdAt: at(7), tag: 'RANDOM', authorId: 'u_priya' }),
  msg({ id: 'e', createdAt: at(6), tag: 'ANNOUNCE', authorId: 'u_ada' }),
];

/** Walk every page and collect ids in order — the property that must never break. */
function pageAllIds(all: StoredMessage[], limit: number): string[] {
  const ids: string[] = [];
  let cursor: string | undefined;
  for (let guard = 0; guard < 1000; guard++) {
    const { items, nextCursor } = selectPage(all, q({ limit, cursor }));
    ids.push(...items.map((m) => m.id));
    if (!nextCursor) break;
    cursor = nextCursor;
  }
  return ids;
}

describe('selectPage — ordering & limit', () => {
  it('returns newest-first', () => {
    const { items } = selectPage(data, q({ limit: 10 }));
    expect(items.map((m) => m.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('respects the limit and exposes a nextCursor when more remain', () => {
    const { items, nextCursor } = selectPage(data, q({ limit: 2 }));
    expect(items.map((m) => m.id)).toEqual(['a', 'b']);
    expect(nextCursor).not.toBeNull();
  });

  it('returns nextCursor === null on the final page', () => {
    const { nextCursor } = selectPage(data, q({ limit: 10 }));
    expect(nextCursor).toBeNull();
  });
});

describe('selectPage — cursor paging', () => {
  it('covers every row exactly once across pages (no gaps, no duplicates)', () => {
    expect(pageAllIds(data, 2)).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(pageAllIds(data, 1)).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(pageAllIds(data, 5)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('never skips or duplicates across a shared-timestamp tie boundary', () => {
    const tie: StoredMessage[] = [
      msg({ id: 'p', createdAt: at(5) }),
      msg({ id: 'q', createdAt: at(5) }), // same instant as p
      msg({ id: 'r', createdAt: at(4) }),
    ];
    // Same timestamp → ordered by id descending (q before p), then r.
    expect(selectPage(tie, q({ limit: 10 })).items.map((m) => m.id)).toEqual([
      'q',
      'p',
      'r',
    ]);
    expect(pageAllIds(tie, 1)).toEqual(['q', 'p', 'r']);
  });
});

describe('selectPage — filters', () => {
  it('filters by tag', () => {
    const { items } = selectPage(data, q({ tag: 'PRODUCT' }));
    expect(items.map((m) => m.id)).toEqual(['a', 'c']);
  });

  it('filters by user', () => {
    const { items } = selectPage(data, q({ userId: 'u_ada' }));
    expect(items.map((m) => m.id)).toEqual(['a', 'c', 'e']);
  });

  it('filters by date range (inclusive)', () => {
    const { items } = selectPage(data, q({ from: at(7), to: at(9) }));
    expect(items.map((m) => m.id)).toEqual(['b', 'c', 'd']);
  });

  it('a date-only "to" (from a date picker) includes the entire day, not just its midnight instant', () => {
    const today = new Date();
    const todayDateOnly = today.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const laterToday = msg({
      id: 'today-afternoon',
      createdAt: new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate(),
          18, // well past the day's UTC-midnight instant
        ),
      ).toISOString(),
    });
    expect(matchesFilters(laterToday, q({ to: todayDateOnly }))).toBe(true);
  });
});

describe('cursor encode/decode', () => {
  it('round-trips createdAt + id', () => {
    const m = data[0];
    expect(decodeCursor(encodeCursor(m))).toEqual({ createdAt: m.createdAt, id: m.id });
  });

  it('returns null for a malformed cursor', () => {
    expect(decodeCursor('!!!not-base64!!!')).toBeNull();
  });

  it('ignores an invalid cursor instead of returning an empty page', () => {
    const { items } = selectPage(data, q({ limit: 2, cursor: 'garbage' }));
    expect(items.map((m) => m.id)).toEqual(['a', 'b']);
  });
});

describe('matchesFilters', () => {
  it('combines tag + user (logical AND)', () => {
    const m = data[0]; // PRODUCT, u_ada
    expect(matchesFilters(m, q({ tag: 'PRODUCT', userId: 'u_ada' }))).toBe(true);
    expect(matchesFilters(m, q({ tag: 'PRODUCT', userId: 'u_marco' }))).toBe(false);
  });
});
