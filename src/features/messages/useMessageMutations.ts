import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { createMessage } from '@/lib/api-client';
import { messagesKey, type MessagesFilters } from '@/features/messages/queryKeys';
import type { Author, CreateMessageInput, Message, MessagesPage } from '@/lib/schemas';

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
