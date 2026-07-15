# DISPATCH

A short-message board. Post ≤240-character messages with a tag, filter the feed by tag / author / date, inline-edit or delete your own.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · TanStack Query + Virtual · Zod · Vitest

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000> — you'll land on `/login`. No database, no env setup.

## Log in

There's no sign-up. Five accounts are seeded, all sharing the password **`dispatch`**:

| Email                | Name         |
| -------------------- | ------------ |
| `ada@dispatch.dev`   | Ada Lovelace |
| `marco@dispatch.dev` | Marco Diaz   |
| `priya@dispatch.dev` | Priya Shah   |
| `grace@dispatch.dev` | Grace Hopper |
| `alan@dispatch.dev`  | Alan Turing  |

Start with **Ada** — she authors the newest messages, so you'll immediately see `EDIT`/`DELETE`, which only ever appear on your own posts.

## What to try

- **Post** — the counter enforces 240; the card appears instantly (optimistic), then reconciles with the server.
- **Filter** by tag / user / date → watch the URL change. Reload or share it: the exact view comes back.
- **Edit / delete** your own message inline. Others' have no controls — and the API returns `403` if you try anyway.
- **Scroll** — ~1,200 messages are seeded and the list is virtualized; `LOAD MORE` pages through them.
- **Resize** to ~390px for the mobile layout.

## Scripts

| Script                    | What                        |
| ------------------------- | --------------------------- |
| `npm run dev`             | Dev server                  |
| `npm run build` / `start` | Production build / serve    |
| `npm test`                | Unit + component tests (86) |
| `npm run typecheck`       | `tsc --noEmit`              |
| `npm run lint` / `format` | ESLint / Prettier           |

A pre-commit hook (husky + lint-staged) blocks commits that fail lint or typecheck.

## Notes

- **The backend is mocked, but real.** Data is served by actual Route Handlers (`/api/*`) over a file-backed store, seeded on first run into `data/messages.json` (git-ignored). Delete that file to reseed.
- **Env is optional.** `.env.example` documents `SESSION_SECRET` and `SEED_PASSWORD`; both have working defaults.

→ **[ARCHITECTURE.md](./ARCHITECTURE.md)** — structure, decisions, rendering strategy, and the bonus answers.
