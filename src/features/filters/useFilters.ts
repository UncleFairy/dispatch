'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { TagSchema } from '@/lib/schemas';
import type { MessagesFilters } from '@/features/messages/queryKeys';

const KEYS = ['tag', 'userId', 'from', 'to'] as const;

/**
 * The URL's `?tag&userId&from&to` search params as the single source of
 * truth for the feed's filters: shareable/bookmarkable, back/forward just
 * works, and `MessagesFilters` (the Query cache key) falls out for free —
 * no separate filter state to keep in sync.
 */
export function useFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const filters = useMemo<MessagesFilters>(() => {
    const tag = TagSchema.safeParse(searchParams.get('tag'));
    return {
      tag: tag.success ? tag.data : undefined,
      userId: searchParams.get('userId') ?? undefined,
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
    };
  }, [searchParams]);

  const setParam = useCallback(
    (key: (typeof KEYS)[number], value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(params.size ? `${pathname}?${params}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const clear = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  const hasActiveFilters = KEYS.some((key) => searchParams.has(key));

  return { filters, setParam, clear, hasActiveFilters };
}
