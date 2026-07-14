import type { NextRequest } from 'next/server';
import { LoginInput } from '@/lib/schemas';
import { authenticate, toPublicUser } from '@/server/auth';
import { setSessionCookie } from '@/server/auth/session';
import { badRequest, handleError, json } from '@/server/http';

export async function POST(req: NextRequest) {
  try {
    const parsed = LoginInput.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest(parsed.error);

    const user = await authenticate(parsed.data.email, parsed.data.password);
    // Same response for unknown email and wrong password — don't leak which.
    if (!user) return json({ error: 'Invalid email or password' }, { status: 401 });

    const res = json({ user: toPublicUser(user) });
    await setSessionCookie(res, user.id);
    return res;
  } catch (err) {
    return handleError(err);
  }
}
