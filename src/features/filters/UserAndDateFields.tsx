'use client';

import { useUsers } from '@/features/filters/useUsers';
import type { MessagesFilters } from '@/features/messages/queryKeys';

export const sectionLabel =
  'font-mono-ui text-[11px] font-bold uppercase tracking-[0.08em] text-muted';

/**
 * The "User" select + "Date" from/to fields (design 02's filter aside, minus
 * the tag pills). Shared by the desktop `FilterPanel` and the mobile
 * advanced-filters panel behind `MobileTagRow`'s ⚙ toggle, so the two never
 * drift out of sync. `clear` is optional: the mobile panel has no header of
 * its own, so it renders "clear" right-aligned on the User row; the desktop
 * aside places it next to the "Filters" heading instead and omits it here.
 */
export function UserAndDateFields({
  filters,
  setParam,
  clear,
  hasActiveFilters,
}: {
  filters: MessagesFilters;
  setParam: (key: 'tag' | 'userId' | 'from' | 'to', value: string | null) => void;
  clear?: () => void;
  hasActiveFilters?: boolean;
}) {
  const { data: users } = useUsers();

  return (
    <>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <label htmlFor="filter-user" className={sectionLabel}>
            User
          </label>
          {clear && (
            <button
              type="button"
              onClick={clear}
              disabled={!hasActiveFilters}
              className="font-mono-ui text-xs text-muted underline underline-offset-2 hover:text-ink disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
            >
              clear
            </button>
          )}
        </div>
        <div className="relative">
          <select
            id="filter-user"
            value={filters.userId ?? ''}
            onChange={(e) => setParam('userId', e.target.value || null)}
            className="h-[46px] w-full appearance-none border-[2.5px] border-ink bg-surface px-3 pr-9 text-sm outline-none"
          >
            <option value="">All users</option>
            {users?.map((user) => (
              <option key={user.id} value={user.id}>
                @{user.handle}
              </option>
            ))}
          </select>
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-mono-ui text-sm"
          >
            ▾
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className={sectionLabel}>Date</div>
        <div className="flex flex-col gap-2">
          <label className="flex h-[46px] items-center border-[2.5px] border-ink bg-surface px-3">
            <span className="font-mono-ui text-sm text-faint">From</span>
            <input
              type="date"
              aria-label="Date from"
              value={filters.from ?? ''}
              max={filters.to ?? undefined}
              onChange={(e) => setParam('from', e.target.value || null)}
              className="ml-auto border-none bg-transparent text-right text-sm outline-none"
            />
          </label>
          <label className="flex h-[46px] items-center border-[2.5px] border-ink bg-surface px-3">
            <span className="font-mono-ui text-sm text-faint">To</span>
            <input
              type="date"
              aria-label="Date to"
              value={filters.to ?? ''}
              min={filters.from ?? undefined}
              onChange={(e) => setParam('to', e.target.value || null)}
              className="ml-auto border-none bg-transparent text-right text-sm outline-none"
            />
          </label>
        </div>
      </div>
    </>
  );
}
