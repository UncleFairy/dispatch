'use client';

import { useFilters } from '@/features/filters/useFilters';
import { FilterPanel } from '@/features/filters/FilterPanel';
import { FeedMain } from '@/features/messages/FeedMain';
import type { Author } from '@/lib/schemas';

/**
 * Owns `useFilters` once and hands the same {filters, setParam} down to both
 * the desktop `FilterPanel` and `FeedMain` (which also threads a subset to
 * `MobileTagRow`) — one URL-derived source of truth, no state to desync.
 */
export function FeedShell({ currentUser }: { currentUser: Author }) {
  const { filters, setParam, clear, hasActiveFilters } = useFilters();

  return (
    <>
      <FilterPanel
        filters={filters}
        setParam={setParam}
        clear={clear}
        hasActiveFilters={hasActiveFilters}
      />
      <FeedMain
        currentUser={currentUser}
        filters={filters}
        setParam={setParam}
        clear={clear}
        hasActiveFilters={hasActiveFilters}
      />
    </>
  );
}
