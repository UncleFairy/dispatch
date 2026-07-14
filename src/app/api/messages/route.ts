import type { NextRequest } from 'next/server';
import { CreateMessageInput, MessagesQuerySchema } from '@/lib/schemas';
import { messageRepo } from '@/server/messages/repo.file';
import { requireUser } from '@/server/auth';
import { badRequest, handleError, json } from '@/server/http';

/** GET /api/messages — filtered, cursor-paginated feed (auth required). */
export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const parsed = MessagesQuerySchema.safeParse(
      Object.fromEntries(req.nextUrl.searchParams),
    );
    if (!parsed.success) return badRequest(parsed.error);
    return json(await messageRepo.list(parsed.data));
  } catch (err) {
    return handleError(err);
  }
}

/** POST /api/messages — create a message authored by the current user. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = CreateMessageInput.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest(parsed.error);
    const message = await messageRepo.create(parsed.data, user.id);
    return json({ message }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
