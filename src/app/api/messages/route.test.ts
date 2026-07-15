import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { UnauthorizedError } from '@/server/errors';

const requireUser = vi.fn();
const messageRepo = { list: vi.fn(), create: vi.fn() };

vi.mock('@/server/auth', () => ({ requireUser: () => requireUser() }));
vi.mock('@/server/messages/repo.file', () => ({ messageRepo }));

const { GET, POST } = await import('@/app/api/messages/route');

const user = {
  id: 'u_ada',
  name: 'Ada Lovelace',
  handle: 'ada_l',
  email: 'ada@dispatch.dev',
  initial: 'A',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/messages', () => {
  it('returns 401 when there is no valid session', async () => {
    requireUser.mockRejectedValue(new UnauthorizedError());
    const res = await GET(new NextRequest('http://localhost/api/messages'));
    expect(res.status).toBe(401);
  });

  it('returns 400 for an invalid query (limit out of range)', async () => {
    requireUser.mockResolvedValue(user);
    const res = await GET(new NextRequest('http://localhost/api/messages?limit=0'));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid request');
  });

  it('returns the repo page for a valid, authenticated query', async () => {
    requireUser.mockResolvedValue(user);
    const page = { items: [], nextCursor: null };
    messageRepo.list.mockResolvedValue(page);
    const res = await GET(new NextRequest('http://localhost/api/messages?tag=PRODUCT'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(page);
    expect(messageRepo.list).toHaveBeenCalledWith(
      expect.objectContaining({ tag: 'PRODUCT' }),
    );
  });
});

describe('POST /api/messages', () => {
  function req(body: unknown) {
    return new NextRequest('http://localhost/api/messages', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  it('returns 401 when there is no valid session', async () => {
    requireUser.mockRejectedValue(new UnauthorizedError());
    const res = await POST(req({ body: 'hello there world', tag: 'PRODUCT' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 for an invalid body (too short)', async () => {
    requireUser.mockResolvedValue(user);
    const res = await POST(req({ body: 'short', tag: 'PRODUCT' }));
    expect(res.status).toBe(400);
  });

  it('creates the message authored by the session user, ignoring any authorId in the body', async () => {
    requireUser.mockResolvedValue(user);
    const created = {
      id: 'msg_1',
      authorId: 'u_ada',
      tag: 'PRODUCT',
      body: 'hello there world',
    };
    messageRepo.create.mockResolvedValue(created);

    const res = await POST(
      req({ body: 'hello there world', tag: 'PRODUCT', authorId: 'u_marco' }),
    );

    expect(res.status).toBe(201);
    expect(messageRepo.create).toHaveBeenCalledWith(
      { body: 'hello there world', tag: 'PRODUCT' },
      'u_ada',
    );
    expect(await res.json()).toEqual({ message: created });
  });
});
