import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { createMessage, deleteMessage, updateMessage } from '@/lib/api-client';
import { messagesKey, type MessagesFilters } from '@/features/messages/queryKeys';
import type {
  Author,
  CreateMessageInput,
  EditMessageInput,
  Message,
  MessagesPage,
} from '@/lib/schemas';

/** Apply `updater` to the one matching message across every cached page. */
function mapMessage(
  data: InfiniteData<MessagesPage> | undefined,
  id: string,
  updater: (message: Message) => Message | null,
): InfiniteData<MessagesPage> | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.flatMap((item) => {
        if (item.id !== id) return [item];
        const next = updater(item);
        return next ? [next] : [];
      }),
    })),
  };
}

/**
 * Create a message with an optimistic insert: the card appears at the top of
 * the feed the instant POST is clicked, before the server has responded.
 * `onMutate` snapshots the cache so `onError` can restore it exactly if the
 * request fails — the optimistic row disappears as if it never happened.
 * `onSettled` refetches regardless of outcome, replacing the temporary row
 * with the server's real one (real id, exact timestamp).
 */
export function useCreateMessage(currentUser: Author, filters: MessagesFilters = {}) {
  const queryClient = useQueryClient();
  const key = messagesKey(filters);

  return useMutation({
    mutationFn: (input: CreateMessageInput) => createMessage(input),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<InfiniteData<MessagesPage>>(key);

      const now = new Date().toISOString();
      const optimisticMessage: Message = {
        id: `optimistic_${crypto.randomUUID()}`,
        authorId: currentUser.id,
        author: currentUser,
        body: input.body,
        tag: input.tag,
        createdAt: now,
        updatedAt: now,
        edited: false,
      };

      queryClient.setQueryData<InfiniteData<MessagesPage>>(key, (old) => {
        if (!old) return old;
        const [firstPage, ...rest] = old.pages;
        return {
          ...old,
          pages: [
            { ...firstPage, items: [optimisticMessage, ...firstPage.items] },
            ...rest,
          ],
        };
      });

      return { previous };
    },

    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

/**
 * Edit a message with an optimistic in-place update: the card reflects the
 * new body/tag immediately, before the server confirms. Same
 * snapshot/restore rollback shape as `useCreateMessage`.
 */
export function useUpdateMessage(filters: MessagesFilters = {}) {
  const queryClient = useQueryClient();
  const key = messagesKey(filters);

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EditMessageInput }) =>
      updateMessage(id, input),

    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<InfiniteData<MessagesPage>>(key);

      queryClient.setQueryData<InfiniteData<MessagesPage>>(key, (old) =>
        mapMessage(old, id, (message) => ({
          ...message,
          ...(input.body !== undefined ? { body: input.body } : {}),
          ...(input.tag !== undefined ? { tag: input.tag } : {}),
          edited: true,
        })),
      );

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

/**
 * Delete a message with an optimistic removal: the card disappears
 * immediately, restored on failure via the same snapshot/rollback shape.
 */
export function useDeleteMessage(filters: MessagesFilters = {}) {
  const queryClient = useQueryClient();
  const key = messagesKey(filters);

  return useMutation({
    mutationFn: (id: string) => deleteMessage(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<InfiniteData<MessagesPage>>(key);

      queryClient.setQueryData<InfiniteData<MessagesPage>>(key, (old) =>
        mapMessage(old, id, () => null),
      );

      return { previous };
    },

    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
