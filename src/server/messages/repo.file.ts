import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  StoredMessageSchema,
  type Message,
  type MessagesQuery,
  type StoredMessage,
} from '@/lib/schemas';
import { SEED_USERS, buildSeedMessages } from '@/server/messages/seed';
import { ForbiddenError, NotFoundError } from '@/server/errors';
import type { MessageRepo, UserRepo } from '@/server/messages/repo';
import { selectPage } from '@/server/messages/paginate';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'messages.json');

const usersById = new Map(SEED_USERS.map((u) => [u.id, u]));

/**
 * Single in-process store, cached on `globalThis` so it survives dev
 * hot-reloads (which re-evaluate modules) instead of re-seeding every edit.
 */
type Store = { messages: StoredMessage[] };
const g = globalThis as unknown as {
  __dispatchStore?: Promise<Store>;
  __dispatchWrite?: Promise<unknown>;
};

function loadStore(): Promise<Store> {
  if (!g.__dispatchStore) {
    g.__dispatchStore = (async () => {
      try {
        const raw = await fs.readFile(DATA_FILE, 'utf8');
        const messages = StoredMessageSchema.array().parse(JSON.parse(raw));
        return { messages };
      } catch {
        // Missing or corrupt file → seed a fresh store and persist it.
        const messages = buildSeedMessages(Date.now());
        await persist(messages);
        return { messages };
      }
    })();
  }
  return g.__dispatchStore;
}

async function persist(messages: StoredMessage[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(messages, null, 2), 'utf8');
}

/**
 * Serialize writes: every mutation is chained after the previous one so two
 * concurrent requests can never interleave and corrupt the JSON file.
 */
function enqueueWrite<T>(fn: () => Promise<T>): Promise<T> {
  const run = (g.__dispatchWrite ?? Promise.resolve()).then(fn, fn);
  g.__dispatchWrite = run.then(
    () => undefined,
    () => undefined,
  );
  return run as Promise<T>;
}

/** Attach the denormalized author (and an `edited` flag) for API responses. */
function toMessage(m: StoredMessage): Message {
  const u = usersById.get(m.authorId);
  const author = u
    ? { id: u.id, name: u.name, handle: u.handle, initial: u.initial }
    : { id: m.authorId, name: 'Unknown', handle: 'unknown', initial: '?' };
  return { ...m, author, edited: m.updatedAt !== m.createdAt };
}

export const messageRepo: MessageRepo = {
  async list(query: MessagesQuery) {
    const { messages } = await loadStore();
    const { items, nextCursor } = selectPage(messages, query);
    return { items: items.map(toMessage), nextCursor };
  },

  async getById(id: string) {
    const { messages } = await loadStore();
    const m = messages.find((x) => x.id === id);
    return m ? toMessage(m) : null;
  },

  async create(input, authorId) {
    const store = await loadStore();
    const now = new Date().toISOString();
    const msg: StoredMessage = {
      id: `msg_${randomUUID()}`,
      authorId,
      body: input.body,
      tag: input.tag,
      createdAt: now,
      updatedAt: now,
    };
    await enqueueWrite(async () => {
      store.messages.push(msg);
      await persist(store.messages);
    });
    return toMessage(msg);
  },

  async update(id, input, userId) {
    const store = await loadStore();
    const existing = store.messages.find((x) => x.id === id);
    if (!existing) throw new NotFoundError('Message not found');
    if (existing.authorId !== userId) {
      throw new ForbiddenError('You can only edit your own messages');
    }
    return enqueueWrite(async () => {
      const m = store.messages.find((x) => x.id === id);
      if (!m) throw new NotFoundError('Message not found');
      if (input.body !== undefined) m.body = input.body;
      if (input.tag !== undefined) m.tag = input.tag;
      m.updatedAt = new Date().toISOString();
      await persist(store.messages);
      return toMessage(m);
    });
  },

  async delete(id, userId) {
    const store = await loadStore();
    const existing = store.messages.find((x) => x.id === id);
    if (!existing) throw new NotFoundError('Message not found');
    if (existing.authorId !== userId) {
      throw new ForbiddenError('You can only delete your own messages');
    }
    await enqueueWrite(async () => {
      const i = store.messages.findIndex((x) => x.id === id);
      if (i !== -1) store.messages.splice(i, 1);
      await persist(store.messages);
    });
  },
};

export const userRepo: UserRepo = {
  async findByEmail(email: string) {
    const target = email.toLowerCase();
    return SEED_USERS.find((u) => u.email.toLowerCase() === target) ?? null;
  },
  async findById(id: string) {
    return usersById.get(id) ?? null;
  },
};
