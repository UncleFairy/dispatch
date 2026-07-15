import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '@/server/errors';

const requireUser = vi.fn();
const messageRepo = { update: vi.fn(), delete: vi.fn() };

vi.mock('@/server/auth', () => ({ requireUser: () => requireUser() }));
vi.mock('@/server/messages/repo.file', () => ({ messageRepo }));

const { PATCH, DELETE } = await import('@/app/api/messages/[id]/route');

const user = {
  id: 'u_ada',
  name: 'Ada Lovelace',
  handle: 'ada_l',
  email: 'ada@dispatch.dev',
  initial: 'A',
};
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PATCH /api/messages/:id', () => {
  function req(body: unknown) {
    return new NextRequest('http://localhost/api/messages/msg_1', {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  it('returns 401 when there is no valid session', async () => {
    requireUser.mockRejectedValue(new UnauthorizedError());
    const res = await PATCH(req({ body: 'updated message body' }), ctx('msg_1'));
    expect(res.status).toBe(401);
  });

  it('returns 400 for an empty patch', async () => {
    requireUser.mockResolvedValue(user);
    const res = await PATCH(req({}), ctx('msg_1'));
    expect(res.status).toBe(400);
  });

  it("returns 403 when the repo rejects editing someone else's message", async () => {
    requireUser.mockResolvedValue(user);
    messageRepo.update.mockRejectedValue(
      new ForbiddenError('You can only edit your own messages'),
    );
    const res = await PATCH(req({ body: 'updated message body' }), ctx('msg_1'));
    expect(res.status).toBe(403);
  });

  it('returns 200 with the updated message on success, scoped to the session user', async () => {
    requireUser.mockResolvedValue(user);
    const updated = { id: 'msg_1', body: 'updated message body' };
    messageRepo.update.mockResolvedValue(updated);
    const res = await PATCH(req({ body: 'updated message body' }), ctx('msg_1'));
    expect(res.status).toBe(200);
    expect(messageRepo.update).toHaveBeenCalledWith(
      'msg_1',
      { body: 'updated message body' },
      'u_ada',
    );
    expect(await res.json()).toEqual({ message: updated });
  });
});

describe('DELETE /api/messages/:id', () => {
  const del = (id: string) =>
    DELETE(
      new NextRequest(`http://localhost/api/messages/${id}`, { method: 'DELETE' }),
      ctx(id),
    );

  it('returns 401 when there is no valid session', async () => {
    requireUser.mockRejectedValue(new UnauthorizedError());
    expect((await del('msg_1')).status).toBe(401);
  });

  it('returns 404 when the message does not exist', async () => {
    requireUser.mockResolvedValue(user);
    messageRepo.delete.mockRejectedValue(new NotFoundError());
    expect((await del('msg_missing')).status).toBe(404);
  });

  it("returns 403 when deleting someone else's message", async () => {
    requireUser.mockResolvedValue(user);
    messageRepo.delete.mockRejectedValue(new ForbiddenError());
    expect((await del('msg_1')).status).toBe(403);
  });

  it('deletes as the session user and returns { ok: true }', async () => {
    requireUser.mockResolvedValue(user);
    messageRepo.delete.mockResolvedValue(undefined);
    const res = await del('msg_1');
    expect(res.status).toBe(200);
    expect(messageRepo.delete).toHaveBeenCalledWith('msg_1', 'u_ada');
    expect(await res.json()).toEqual({ ok: true });
  });
});
