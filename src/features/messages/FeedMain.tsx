'use client';

import { useMessages } from '@/features/messages/useMessages';
import { MessageCard } from '@/features/messages/MessageCard';

/**
 * The message list, hydrated from the server prefetch (see feed/page.tsx) so
 * it paints with data on first render — no loading flash for the common case.
 * Non-virtualized and un-paginated for now; both arrive once this list can
 * actually grow past a first page (LOAD MORE + windowing).
 */
export function FeedMain({ currentUserId }: { currentUserId: string }) {
  const { data } = useMessages({});
  const items = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <main className="flex min-w-0 flex-col gap-5">
      {items.map((message) => (
        <MessageCard
          key={message.id}
          message={message}
          isOwn={message.authorId === currentUserId}
        />
      ))}
    </main>
  );
}
