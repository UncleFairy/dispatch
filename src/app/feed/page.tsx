import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { NavBar } from '@/components/ui';
import { getSessionUser, toPublicUser } from '@/server/auth';
import { messageRepo } from '@/server/messages/repo.file';
import { messagesKey } from '@/features/messages/queryKeys';
import { FeedShell } from '@/features/messages/FeedShell';

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
 *
 * Same frame treatment as the login page: a 3px ink border + 8px offset
 * shadow around the whole viewport, on a white surround (the design's grey
 * canvas behind the frame isn't a prod colour). Unlike the login page's
 * fixed-size mockup frame, this one isn't `overflow-hidden` — the feed can
 * run to 1000+ messages, so the frame has to grow with the page and let the
 * window scroll rather than clipping content at one viewport's height.
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

  const publicUser = toPublicUser(user);

  return (
    <div className="flex min-h-screen w-full bg-surface p-3">
      <div className="flex w-full flex-col border-[3px] border-ink bg-paper shadow-hard-8">
        <NavBar user={publicUser} />
        <div className="mx-auto grid w-full max-w-[1120px] flex-1 grid-cols-1 gap-8 p-6 md:grid-cols-[296px_1fr] md:p-8">
          <HydrationBoundary state={dehydrate(queryClient)}>
            {/* useSearchParams (in useFilters) requires a Suspense boundary. A
                filtered URL still paints instantly: the prefetch above only
                ever matches the unfiltered key, so anything else just fetches
                client-side like any other Query cache miss. */}
            <Suspense fallback={null}>
              <FeedShell currentUser={publicUser} />
            </Suspense>
          </HydrationBoundary>
        </div>
      </div>
    </div>
  );
}
