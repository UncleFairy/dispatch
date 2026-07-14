import type { NextRequest } from 'next/server';
import { EditMessageInput } from '@/lib/schemas';
import { messageRepo } from '@/server/messages/repo.file';
import { requireUser } from '@/server/auth';
import { badRequest, handleError, json } from '@/server/http';

// In Next 16 the dynamic segment params arrive as a Promise.
type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/messages/:id — author-only inline edit. */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const parsed = EditMessageInput.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest(parsed.error);
    const message = await messageRepo.update(id, parsed.data, user.id);
    return json({ message });
  } catch (err) {
    return handleError(err);
  }
}

/** DELETE /api/messages/:id — author-only delete. */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    await messageRepo.delete(id, user.id);
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
