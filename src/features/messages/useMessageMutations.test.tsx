// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  QueryClient,
  QueryClientProvider,
  type InfiniteData,
} from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useCreateMessage,
  useDeleteMessage,
  useUpdateMessage,
} from '@/features/messages/useMessageMutations';
import { messagesKey } from '@/features/messages/queryKeys';
import type { Author, Message, MessagesPage } from '@/lib/schemas';

vi.mock('@/lib/api-client', () => ({
  createMessage: vi.fn(),
  updateMessage: vi.fn(),
  deleteMessage: vi.fn(),
}));

const { createMessage, updateMessage, deleteMessage } = await import('@/lib/api-client');

const currentUser: Author = {
  id: 'u_ada',
  name: 'Ada Lovelace',
  handle: 'ada_l',
  initial: 'A',
};

function msg(partial: Partial<Message> & Pick<Message, 'id'>): Message {
  return {
    authorId: 'u_marco',
    author: { id: 'u_marco', name: 'Marco Diaz', handle: 'marco', initial: 'M' },
    body: 'original body',
    tag: 'RANDOM',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    edited: false,
    ...partial,
  };
}

function seedCache(client: QueryClient, items: Message[]) {
  const page: InfiniteData<MessagesPage> = {
    pages: [{ items, nextCursor: null }],
    pageParams: [undefined],
  };
  client.setQueryData(messagesKey({}), page);
  return page;
}

function readItems(client: QueryClient): Message[] {
  const data = client.getQueryData<InfiniteData<MessagesPage>>(messagesKey({}));
  return data?.pages.flatMap((p) => p.items) ?? [];
}

function wrapper(client: QueryClient) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

/**
 * A rejection delayed well past `waitFor`'s default 50ms poll interval. The
 * optimistic-update lifecycle (onMutate → mutationFn → onError → rollback)
 * otherwise completes between two polls, so the transient optimistic state
 * is never actually observed even though it did happen.
 */
function delayedRejection(error: Error): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(error), 150));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useCreateMessage — optimistic rollback', () => {
  it('inserts the message immediately, then rolls back on failure', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const original = seedCache(client, [msg({ id: 'seed-1' })]);
    vi.mocked(createMessage).mockImplementation(() =>
      delayedRejection(new Error('network down')),
    );

    const { result } = renderHook(() => useCreateMessage(currentUser), {
      wrapper: wrapper(client),
    });

    act(() => result.current.mutate({ body: 'a brand new message', tag: 'PRODUCT' }));

    // Optimistic insert lands synchronously in onMutate.
    await waitFor(() => expect(readItems(client)).toHaveLength(2));
    expect(readItems(client)[0].body).toBe('a brand new message');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData(messagesKey({}))).toEqual(original);
  });

  it('leaves the optimistic message in place when the request succeeds', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    seedCache(client, [msg({ id: 'seed-1' })]);
    vi.mocked(createMessage).mockResolvedValue(
      msg({
        id: 'msg_real',
        body: 'a brand new message',
        authorId: 'u_ada',
        author: currentUser,
      }),
    );

    const { result } = renderHook(() => useCreateMessage(currentUser), {
      wrapper: wrapper(client),
    });

    act(() => result.current.mutate({ body: 'a brand new message', tag: 'PRODUCT' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(readItems(client).some((m) => m.body === 'a brand new message')).toBe(true);
  });
});

describe('useUpdateMessage — optimistic rollback', () => {
  it('applies the edit immediately, then rolls back on failure', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const original = seedCache(client, [msg({ id: 'msg_1', body: 'original body' })]);
    vi.mocked(updateMessage).mockImplementation(() =>
      delayedRejection(new Error('server exploded')),
    );

    const { result } = renderHook(() => useUpdateMessage(), { wrapper: wrapper(client) });

    act(() => result.current.mutate({ id: 'msg_1', input: { body: 'edited body' } }));

    await waitFor(() => expect(readItems(client)[0].body).toBe('edited body'));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData(messagesKey({}))).toEqual(original);
  });
});

describe('useDeleteMessage — optimistic rollback', () => {
  it('removes the message immediately, then restores it on failure', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const original = seedCache(client, [msg({ id: 'msg_1' }), msg({ id: 'msg_2' })]);
    vi.mocked(deleteMessage).mockImplementation(() =>
      delayedRejection(new Error('cannot delete')),
    );

    const { result } = renderHook(() => useDeleteMessage(), { wrapper: wrapper(client) });

    act(() => result.current.mutate('msg_1'));

    await waitFor(() => expect(readItems(client)).toHaveLength(1));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData(messagesKey({}))).toEqual(original);
  });

  it('leaves the message removed when the delete succeeds', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    seedCache(client, [msg({ id: 'msg_1' }), msg({ id: 'msg_2' })]);
    vi.mocked(deleteMessage).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteMessage(), { wrapper: wrapper(client) });

    act(() => result.current.mutate('msg_1'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(readItems(client).map((m) => m.id)).toEqual(['msg_2']);
  });
});
