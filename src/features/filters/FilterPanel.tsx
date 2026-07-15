'use client';

import { TAGS, type Tag } from '@/lib/schemas';
import { TagPill } from '@/components/ui';
import { UserAndDateFields, sectionLabel } from '@/features/filters/UserAndDateFields';
import type { MessagesFilters } from '@/features/messages/queryKeys';

/** Desktop filter aside (design 02): tag pills, user select, date range, clear. */
export function FilterPanel({
  filters,
  setParam,
  clear,
  hasActiveFilters,
}: {
  filters: MessagesFilters;
  setParam: (key: 'tag' | 'userId' | 'from' | 'to', value: string | null) => void;
  clear: () => void;
  hasActiveFilters: boolean;
}) {
  function toggleTag(tag: Tag) {
    setParam('tag', filters.tag === tag ? null : tag);
  }

  return (
    <aside className="hidden flex-col gap-6 md:flex">
      <div className="flex items-center justify-between">
        <h2 className="font-mono-ui text-[13px] font-bold tracking-widest uppercase">
          Filters
        </h2>
        <button
          type="button"
          onClick={clear}
          disabled={!hasActiveFilters}
          className="font-mono-ui text-xs text-muted underline underline-offset-2 hover:text-ink disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
        >
          clear
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className={sectionLabel}>Tag</div>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag) => (
            <button key={tag} type="button" onClick={() => toggleTag(tag)}>
              <TagPill active={filters.tag === tag} className="cursor-pointer">
                {tag}
              </TagPill>
            </button>
          ))}
        </div>
      </div>

      <UserAndDateFields filters={filters} setParam={setParam} />
    </aside>
  );
}
