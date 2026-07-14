import { TAGS, type StoredMessage, type User } from '@/lib/schemas';

/**
 * Seeded accounts. There is no sign-up flow — these are the only users, and
 * they all share one password (checked in the auth layer, documented in the
 * README). The first three match the names shown in the reference design.
 */
export const SEED_USERS: User[] = [
  {
    id: 'u_ada',
    name: 'Ada Lovelace',
    handle: 'ada_l',
    email: 'ada@dispatch.dev',
    initial: 'A',
  },
  {
    id: 'u_marco',
    name: 'Marco Diaz',
    handle: 'marco',
    email: 'marco@dispatch.dev',
    initial: 'M',
  },
  {
    id: 'u_priya',
    name: 'Priya Shah',
    handle: 'priya',
    email: 'priya@dispatch.dev',
    initial: 'P',
  },
  {
    id: 'u_grace',
    name: 'Grace Hopper',
    handle: 'grace',
    email: 'grace@dispatch.dev',
    initial: 'G',
  },
  {
    id: 'u_alan',
    name: 'Alan Turing',
    handle: 'alan',
    email: 'alan@dispatch.dev',
    initial: 'A',
  },
];

/** Small deterministic PRNG (mulberry32) so the seed is identical every run. */
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A pool of realistic short messages for the generated history. */
const BODIES = [
  'Anyone else seeing flaky CI on the main branch this morning?',
  'Pushed a fix for the pagination cursor — please re-test.',
  'Design review moved to 3pm. Bring the mobile mocks.',
  'Reminder: freeze starts Friday. Merge or hold.',
  'The new empty state reads much better now, nice work.',
  'Can we cache the feed query? It refetches on every focus.',
  'Shipping the accessibility pass: focus rings + aria-live.',
  'Who owns the tag color tokens? Need one more accent.',
  'Virtualized the list — 1000+ rows scroll smoothly now.',
  'Heads up: renaming the auth cookie next release.',
  'Optimistic updates are in. Rollback tested on failure.',
  'Filters now live in the URL, so links are shareable.',
  'Bug: date filter off by one near midnight. Investigating.',
  'Trimmed the bundle by lazy-loading the composer.',
  'Standup notes posted. TL;DR: on track for demo.',
  'Prettier + eslint gate added to pre-commit. No more churn.',
  'Can someone review the repo interface? Want a second pair of eyes.',
  'Mobile nav overlaps the compose box under 360px.',
  'Added skeletons for the loading state — feels faster.',
  'Cursor pagination beats offset here; no dupes on insert.',
];

/**
 * Builds the initial message set: the three design cards as the most recent,
 * followed by ~1,200 progressively older generated messages. Timestamps are
 * anchored to `nowMs` (first-seed time) so relative labels like "2m" read
 * correctly; once written to the store they stay fixed.
 */
export function buildSeedMessages(nowMs: number, count = 1200): StoredMessage[] {
  const rnd = mulberry32(0xd15fa7c4);
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
  const id = (i: number) => `seed-${String(i).padStart(4, '0')}`;

  const designed = [
    {
      authorId: 'u_ada',
      tag: 'PRODUCT' as const,
      body: 'Shipped the new filter bar — tag + date now sync to the URL.',
      agoMs: 2 * 60_000,
    },
    {
      authorId: 'u_marco',
      tag: 'DESIGN' as const,
      body: 'Is the empty-state copy too dry?',
      agoMs: 18 * 60_000,
    },
    {
      authorId: 'u_priya',
      tag: 'ANNOUNCE' as const,
      body: 'Reminder: standup moves to 10:30 starting next week.',
      agoMs: 60 * 60_000,
    },
  ];

  const messages: StoredMessage[] = designed.map((d, i) => {
    const iso = new Date(nowMs - d.agoMs).toISOString();
    return {
      id: id(i),
      authorId: d.authorId,
      body: d.body,
      tag: d.tag,
      createdAt: iso,
      updatedAt: iso,
    };
  });

  // Walk backwards in time, 1–60 minutes per step, for the historical fill.
  let cursorMs = nowMs - 90 * 60_000;
  for (let i = designed.length; i < count; i++) {
    cursorMs -= 60_000 + Math.floor(rnd() * 59 * 60_000);
    const iso = new Date(cursorMs).toISOString();
    const author = pick(SEED_USERS);
    messages.push({
      id: id(i),
      authorId: author.id,
      body: pick(BODIES),
      tag: pick(TAGS),
      createdAt: iso,
      updatedAt: iso,
    });
  }

  return messages;
}
