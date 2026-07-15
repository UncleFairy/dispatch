import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { MessageRepo } from '@/server/messages/repo';
import { ForbiddenError, NotFoundError } from '@/server/errors';

/**
 * Points the file-backed repo at a throwaway directory (via DISPATCH_DATA_DIR,
 * read once at module import time) so these tests never touch the real
 * data/messages.json, then imports the module fresh.
 */
let messageRepo: MessageRepo;
let tmpDir: string;

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dispatch-repo-test-'));
  process.env.DISPATCH_DATA_DIR = tmpDir;
  ({ messageRepo } = await import('@/server/messages/repo.file'));
});

afterAll(async () => {
  delete process.env.DISPATCH_DATA_DIR;
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('messageRepo — create & list', () => {
  it('creates a message authored by the given userId and lists it newest-first', async () => {
    const created = await messageRepo.create(
      { body: 'hello world', tag: 'RANDOM' },
      'u_ada',
    );
    expect(created.authorId).toBe('u_ada');
    expect(created.author.id).toBe('u_ada');
    expect(created.edited).toBe(false);

    const { items } = await messageRepo.list({ limit: 20 });
    expect(items[0].id).toBe(created.id);
  });

  it('persists the created message to disk', async () => {
    const raw = await fs.readFile(path.join(tmpDir, 'messages.json'), 'utf8');
    const stored = JSON.parse(raw);
    expect(Array.isArray(stored)).toBe(true);
    expect(stored.length).toBeGreaterThan(0);
  });
});

describe('messageRepo — ownership enforcement', () => {
  it('lets the author update their own message', async () => {
    const created = await messageRepo.create(
      { body: 'owned by ada', tag: 'DESIGN' },
      'u_ada',
    );
    const updated = await messageRepo.update(
      created.id,
      { body: 'edited by ada' },
      'u_ada',
    );
    expect(updated.body).toBe('edited by ada');
    expect(updated.edited).toBe(true);
  });

  it("throws ForbiddenError when a non-author tries to update someone else's message", async () => {
    const created = await messageRepo.create(
      { body: 'owned by ada', tag: 'DESIGN' },
      'u_ada',
    );
    await expect(
      messageRepo.update(created.id, { body: 'hijacked' }, 'u_marco'),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('lets the author delete their own message', async () => {
    const created = await messageRepo.create(
      { body: 'to be deleted', tag: 'RANDOM' },
      'u_priya',
    );
    await messageRepo.delete(created.id, 'u_priya');
    expect(await messageRepo.getById(created.id)).toBeNull();
  });

  it("throws ForbiddenError when a non-author tries to delete someone else's message", async () => {
    const created = await messageRepo.create(
      { body: 'protected', tag: 'RANDOM' },
      'u_priya',
    );
    await expect(messageRepo.delete(created.id, 'u_marco')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(await messageRepo.getById(created.id)).not.toBeNull();
  });

  it('throws NotFoundError when updating or deleting a nonexistent message', async () => {
    await expect(
      messageRepo.update('msg_does-not-exist', { body: 'x' }, 'u_ada'),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      messageRepo.delete('msg_does-not-exist', 'u_ada'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
