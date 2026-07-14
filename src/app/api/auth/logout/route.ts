import { clearSessionCookie } from '@/server/auth/session';
import { json } from '@/server/http';

export async function POST() {
  const res = json({ ok: true });
  clearSessionCookie(res);
  return res;
}
