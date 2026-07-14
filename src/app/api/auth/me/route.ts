import { getSessionUser, toPublicUser } from '@/server/auth';
import { json } from '@/server/http';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return json({ error: 'Not authenticated' }, { status: 401 });
  return json({ user: toPublicUser(user) });
}
