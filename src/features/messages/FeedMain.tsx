'use client';

import { useMessages } from '@/features/messages/useMessages';
import {
  useUpdateMessage,
  useDeleteMessage,
} from '@/features/messages/useMessageMutations';
import { MessageList } from '@/features/messages/MessageList';
import { Composer } from '@/features/messages/Composer';
import type { Author } from '@/lib/schemas';

/**
 * The message list, hydrated from the server prefetch (see feed/page.tsx) so
 * it paints with data on first render — no loading flash for the common case.
 */
export function FeedMain({ currentUser }: { currentUser: Author }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages({});
  const items = data?.pages.flatMap((page) => page.items) ?? [];

  const updateMutation = useUpdateMessage();
  const deleteMutation = useDeleteMessage();

  return (
    <main className="flex min-w-0 flex-col gap-5">
      <Composer currentUser={currentUser} />
      <MessageList
        messages={items}
        currentUserId={currentUser.id}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={() => fetchNextPage()}
        onUpdate={(id, input, options) => updateMutation.mutate({ id, input }, options)}
        updatingId={updateMutation.isPending ? updateMutation.variables?.id : undefined}
        onDelete={(id) => deleteMutation.mutate(id)}
        deletingId={deleteMutation.isPending ? deleteMutation.variables : undefined}
      />
    </main>
  );
}
