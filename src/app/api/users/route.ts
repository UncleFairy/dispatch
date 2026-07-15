import { userRepo } from '@/server/messages/repo.file';
import { requireUser } from '@/server/auth';
import { handleError, json } from '@/server/http';

/** GET /api/users — every seeded account, for the feed's "User" filter. */
export async function GET() {
  try {
    await requireUser();
    const users = await userRepo.list();
    return json({ users });
  } catch (err) {
    return handleError(err);
  }
}
