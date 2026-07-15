import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { NavBar } from '@/components/ui';
import { getSessionUser, toPublicUser } from '@/server/auth';
import { messageRepo } from '@/server/messages/repo.file';
import { messagesKey } from '@/features/messages/queryKeys';
import { FeedMain } from '@/features/messages/FeedMain';

export const metadata: Metadata = { title: 'Feed — DISPATCH' };

/**
 * Feed shell (design 02). The proxy already keeps unauthenticated visitors
 * out of this route; this check is defense in depth so the page never
 * depends on the proxy alone for its authorization.
 *
 * The first page of messages is fetched here via the repo directly (no HTTP
 * round trip — this *is* the server) and pushed into a fresh QueryClient,
 * then dehydrated into the client's cache through HydrationBoundary. The
 * client-side `useMessages` hook is keyed identically (`messagesKey({})`),
 * so it adopts this data instead of re-fetching on mount.
 */
export default async function FeedPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const queryClient = new QueryClient();
  await queryClient.prefetchInfiniteQuery({
    queryKey: messagesKey({}),
    queryFn: () => messageRepo.list({ limit: 20 }),
    initialPageParam: null,
  });

  return (
    <div className="min-h-screen bg-paper">
      <NavBar user={toPublicUser(user)} />
      <div className="mx-auto grid max-w-[1120px] grid-cols-1 gap-8 p-6 md:grid-cols-[296px_1fr] md:p-8">
        <aside className="flex flex-col gap-6">
          <h2 className="font-mono-ui text-[13px] font-bold tracking-wide uppercase">
            Filters
          </h2>
        </aside>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <FeedMain currentUserId={user.id} />
        </HydrationBoundary>
      </div>
    </div>
  );
}
