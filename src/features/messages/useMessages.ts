import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchMessages } from '@/lib/api-client';
import { messagesKey, type MessagesFilters } from '@/features/messages/queryKeys';

/**
 * The feed as an infinite, cursor-paginated query. Keyed by filters so each
 * filter combination gets its own cache entry — switching tags never shows a
 * stale flash of the previous tag's messages.
 */
export function useMessages(filters: MessagesFilters) {
  return useInfiniteQuery({
    queryKey: messagesKey(filters),
    queryFn: ({ pageParam }) =>
      fetchMessages({ ...filters, cursor: pageParam ?? undefined }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
