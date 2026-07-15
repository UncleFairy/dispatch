'use client';

import { useMessages } from '@/features/messages/useMessages';
import { MessageList } from '@/features/messages/MessageList';

/**
 * The message list, hydrated from the server prefetch (see feed/page.tsx) so
 * it paints with data on first render — no loading flash for the common case.
 */
export function FeedMain({ currentUserId }: { currentUserId: string }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages({});
  const items = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <main className="min-w-0">
      <MessageList
        messages={items}
        currentUserId={currentUserId}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={() => fetchNextPage()}
      />
    </main>
  );
}
