import 'server-only';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySessionToken } from '@/server/auth/session';
import { userRepo } from '@/server/messages/repo.file';
import { UnauthorizedError } from '@/server/errors';
import type { Author, User } from '@/lib/schemas';

/**
 * Server-side auth helpers. Node-only (reads cookies, touches the user repo);
 * never imported by the Edge proxy — that path uses session.ts directly.
 */

// Mock credential check: there is no sign-up, so all seeded accounts share one
// password (documented in the README / .env.example).
const SHARED_PASSWORD = process.env.SEED_PASSWORD ?? 'dispatch';

/** Strip the email before a user is ever sent to the client. */
export function toPublicUser(user: User): Author {
  return { id: user.id, name: user.name, handle: user.handle, initial: user.initial };
}

export async function authenticate(
  email: string,
  password: string,
): Promise<User | null> {
  const user = await userRepo.findByEmail(email);
  if (!user || password !== SHARED_PASSWORD) return null;
  return user;
}

/** The current user from the session cookie, or null if unauthenticated. */
export async function getSessionUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const userId = await verifySessionToken(token);
  if (!userId) return null;
  return userRepo.findById(userId);
}

/** Like getSessionUser but throws UnauthorizedError → mapped to 401 by handlers. */
export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  return user;
}
