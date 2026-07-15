'use client';

import { useState } from 'react';
import { Card, TagPill } from '@/components/ui';
import { TAGS, type Tag } from '@/lib/schemas';
import { UserAndDateFields } from '@/features/filters/UserAndDateFields';
import type { MessagesFilters } from '@/features/messages/queryKeys';

/**
 * Compact mobile substitute for the desktop `FilterPanel` (design 02, 390px
 * frame): a scrollable row of tag pills plus a ⚙ toggle — the mobile mockup
 * tucks the User/Date fields behind that icon rather than showing the full
 * aside, which would push the feed too far down the page on a phone.
 */
export function MobileTagRow({
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
  const [advancedOpen, setAdvancedOpen] = useState(false);

  function toggleTag(tag: Tag) {
    setParam('tag', filters.tag === tag ? null : tag);
  }

  return (
    <div className="flex flex-col gap-3 md:hidden">
      <div className="flex items-center gap-2 overflow-x-auto">
        {TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className="shrink-0"
          >
            <TagPill
              active={filters.tag === tag}
              className="text-[11px] whitespace-nowrap"
            >
              {tag}
            </TagPill>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setAdvancedOpen((o) => !o)}
          aria-expanded={advancedOpen}
          aria-label="More filters"
          className="ml-auto flex h-8 w-9 shrink-0 items-center justify-center border-[2.5px] border-ink bg-surface font-mono-ui"
        >
          ⚙
        </button>
      </div>

      {advancedOpen && (
        <Card shadow="sm" className="flex flex-col gap-4 p-4">
          <UserAndDateFields
            filters={filters}
            setParam={setParam}
            clear={clear}
            hasActiveFilters={hasActiveFilters}
          />
        </Card>
      )}
    </div>
  );
}
