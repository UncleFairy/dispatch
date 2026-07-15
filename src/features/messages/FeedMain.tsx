'use client';

import { useMessages } from '@/features/messages/useMessages';
import {
  useUpdateMessage,
  useDeleteMessage,
} from '@/features/messages/useMessageMutations';
import { MessageList } from '@/features/messages/MessageList';
import { Composer } from '@/features/messages/Composer';
import { LoadingSkeleton } from '@/features/messages/LoadingSkeleton';
import { EmptyState } from '@/features/messages/EmptyState';
import { MobileTagRow } from '@/features/filters/MobileTagRow';
import type { Author } from '@/lib/schemas';
import type { MessagesFilters } from '@/features/messages/queryKeys';

/**
 * The message list, hydrated from the server prefetch (see feed/page.tsx) so
 * it paints with data on first render — no loading flash for the common
 * case (the unfiltered feed). Any other filter combination is its own Query
 * cache entry, keyed off `filters`, and fetches normally on demand.
 */
export function FeedMain({
  currentUser,
  filters,
  setParam,
  clear,
  hasActiveFilters,
}: {
  currentUser: Author;
  filters: MessagesFilters;
  setParam: (key: 'tag' | 'userId' | 'from' | 'to', value: string | null) => void;
  clear: () => void;
  hasActiveFilters: boolean;
}) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useMessages(filters);
  const items = data?.pages.flatMap((page) => page.items) ?? [];

  const updateMutation = useUpdateMessage(filters);
  const deleteMutation = useDeleteMessage(filters);

  return (
    <main className="flex min-w-0 flex-col gap-5">
      <Composer currentUser={currentUser} />
      <MobileTagRow
        filters={filters}
        setParam={setParam}
        clear={clear}
        hasActiveFilters={hasActiveFilters}
      />
      <section aria-busy={isLoading}>
        {isLoading ? (
          <LoadingSkeleton />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <MessageList
            messages={items}
            currentUserId={currentUser.id}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={() => fetchNextPage()}
            onUpdate={(id, input, options) =>
              updateMutation.mutate({ id, input }, options)
            }
            updatingId={
              updateMutation.isPending ? updateMutation.variables?.id : undefined
            }
            onDelete={(id) => deleteMutation.mutate(id)}
            deletingId={deleteMutation.isPending ? deleteMutation.variables : undefined}
          />
        )}
      </section>
    </main>
  );
}
