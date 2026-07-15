# Architecture

## Structure

```
src/
  app/            routes: /login, /feed, /api/* (Route Handlers)
  proxy.ts        Next 16 middleware — gates /feed on the session cookie
  components/ui/  presentational primitives (Button, Input, Card, TagPill, …)
  features/       feature slices: auth, messages, filters (hooks + components)
  lib/            shared: schemas (Zod contracts), api-client, cn, time
  server/         server-only: auth/ (session), messages/ (repo, paginate, seed)
```

Dependencies point one way:

```
schemas (contracts)  ←  used by everything
repo.ts (interface)  ←  repo.file.ts (mock implementation)
route handlers  →  auth + repo          the only place HTTP meets data
components/hooks  →  api-client  →  /api/*
```

Each layer knows only the one below it. The UI never touches storage; storage never knows about HTTP.

## Key decisions

**1. A repository _interface_, with the mock behind it.**
`messages/repo.ts` declares `MessageRepo`; `repo.file.ts` implements it over a JSON file. Handlers depend on the interface, never the file.
_Why:_ the mock becomes a swappable detail. Moving to Postgres is one new file — no route, hook, or component changes. This is the seam a real backend slots into.

**2. Zod schemas are the single source of truth.**
Shapes are defined once in `lib/schemas.ts`; TypeScript types are derived (`z.infer`).
_Why:_ TypeScript disappears at runtime, so anything crossing a boundary (request bodies, URL params, the JSON file) is unchecked. Zod validates at runtime **and** produces the types, so the two can't drift. The same `CreateMessageInput` guards the API and the composer form.

**3. Cursor pagination, not offset.**
The cursor is an opaque `base64(createdAt|id)`.
_Why:_ offset (`page=2`) counts _positions_, and positions shift the moment someone posts — you get duplicated or skipped rows mid-scroll. A cursor anchors to a specific message instead. The `id` tiebreak makes the ordering total, so messages sharing a timestamp can't straddle a page boundary. It maps 1:1 onto a real query: `WHERE (created_at, id) < (?, ?) ORDER BY … LIMIT n`.

**4. Filters live in the URL.**
`useFilters` reads/writes `?tag&userId&from&to`, and those filters _are_ the Query cache key.
_Why:_ the requirement is shareable/bookmarkable views. Making the URL the source of truth delivers that, plus back/forward, for free — and there's no second copy of filter state to keep in sync. Each combination caches separately, so switching tags never flashes the previous tag's rows.

**5. Auth: a signed httpOnly cookie, enforced in three places.**
Login sets `dispatch_session = userId.HMAC(userId)`, signed with Web Crypto so the _same_ code runs in Node and in the Edge proxy.

- **proxy** — redirects before a page renders
- **route handlers** — `requireUser()` on every mutation
- **repo** — `authorId === userId` for edit/delete

_Why:_ `httpOnly` keeps JavaScript (and XSS) away from the cookie; the HMAC stops a user rewriting it to `u_marco`. Ownership is enforced at the **data layer**, not hidden in the UI — the API answers `403` even if you skip the client entirely. A new message's author comes from the session, never the request body.

**6. Optimistic UI with real rollback.**
Each mutation snapshots the cache (`onMutate`), applies the change immediately, restores that snapshot on failure (`onError`), and refetches either way (`onSettled`).
_Why:_ the feed feels instant, but a failed request must not leave a lie on screen. The snapshot restores the exact prior state; the refetch swaps the temporary row for the server's real one (real id, real timestamp).

**7. Window virtualization.**
`useWindowVirtualizer` mounts only the rows near the viewport (~1,200 messages seeded).
_Why:_ DOM nodes — not data — are what make long feeds janky. It virtualizes against the _window_ because the design scrolls the whole page, not an inner box. Card heights vary with body length, so rows are measured after render rather than assumed.

## Rendering strategy per page

The deciding factor is **request-time data**: touching `cookies()` or `searchParams` forces dynamic rendering.

| Route    | Strategy                         | Why                                                                                                                                                                                                                                                                                                                                    |
| -------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/login` | **Static shell + client island** | Identical for everyone, no request data. The page prerenders; only `<LoginForm>` ships JS.                                                                                                                                                                                                                                             |
| `/feed`  | **Dynamic (SSR) + client cache** | Reads the session cookie → per-user and always fresh, so it must render per request. The server loads page 1 **through the repo directly** (no HTTP hop — it _is_ the server) and dehydrates it into the Query cache, so the client hydrates with data instead of refetching. Pagination, filters, and mutations then run client-side. |
| `/api/*` | Always dynamic                   | Route Handlers.                                                                                                                                                                                                                                                                                                                        |

**Why not SSG/ISR for the feed:** both cache one shared HTML document. The feed is auth-gated and per-user — a cached page would serve one person's view to another, and be stale the moment anyone posts. ISR fits shared, slow-changing content; this is neither.

_Next step:_ Next 16's Cache Components / PPR would let us prerender the static shell and stream only the personalized part.

## Bonus — keeping the bundle small and avoiding re-renders as features grow

- **Server Components by default.** `'use client'` is pushed down to the leaves that genuinely need state (`LoginForm`, `Composer`, `MessageList`). Shells stay server-rendered and ship no JS.
- **Primitives carry no `'use client'`** — they render on whichever side imports them, so they never drag a page into the client bundle.
- **Cache keys derived from the URL** mean no duplicate filter state and no context re-render cascades.
- **Virtualization** caps DOM size no matter how large the dataset gets.
- `next/font` self-hosts fonts (no external request, no layout shift); Tailwind emits only the classes actually used.
- As it grows: `memo` on `MessageCard` (its props are already per-row), keep the Query cache as the one source of server state rather than copying it into local state, and code-split heavy leaves. Measure before memoizing — needless memoization costs more than it saves.

## Bonus — if users report the feed feels janky while scrolling

Measure first; don't guess.

1. **Reproduce and record** a Performance profile while scrolling. Look for **long tasks (>50ms)** and dropped frames — that alone tells you whether it's JS, style/layout, or paint.
2. **Re-renders?** React DevTools Profiler → "why did this render". A scroll-driven state update re-rendering the whole list is the classic cause.
3. **DOM size?** Count mounted rows. If virtualization is off or misconfigured, all ~1,200 cards are live.
4. **Layout thrash?** Watch for Recalculate Style / Layout spikes — usually a wrong `estimateSize` forcing constant re-measurement, or images/fonts without reserved space shifting rows mid-scroll.
5. **Isolate** by bisecting: swap rows for plain `<div>`s. Smooth ⇒ the card is at fault; still janky ⇒ it's the list/scroll wiring.

Most likely culprits here, in order: unmemoized rows re-rendering every scroll tick, a bad `estimateSize`, and non-passive scroll listeners.

## Testing

86 tests / 11 files (Vitest; jsdom opted into per file). Coverage is aimed where bugs actually hurt, not at a percentage:

- **cursor pagination** — paging covers every row exactly once, including across a shared-timestamp tie
- **schema boundaries** — 10/240 chars, tag enum, limit coercion
- **ownership** — `403` for non-authors, in the repo _and_ the route handlers
- **optimistic rollback** — cache restored exactly on failure
- **URL ↔ filter sync**

## Next steps

- **CI**: GitHub Actions running `lint → typecheck → test → build` on every PR (today's hook is local-only).
- **E2E**: Playwright for the flows that cross layers — login → post → filter → share URL → delete.
- **Real persistence**: implement `MessageRepo` against Postgres/Prisma; the cursor already maps to an indexed query, and nothing above the repo changes.
- **Real auth**: hashed credentials instead of a shared password, session expiry/refresh, rate-limited login.
- **Ops**: deploy to Vercel, add error tracking and a health check.
