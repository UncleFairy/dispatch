'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { MessageCard } from '@/features/messages/MessageCard';
import type { EditMessageInput, Message } from '@/lib/schemas';

// Rough average card height (body text varies 1-3 lines); corrected per-row
// once each card is actually measured, so this only affects the very first
// paint and the scrollbar's initial guess at total height.
const ESTIMATED_ROW_HEIGHT = 175;

/**
 * Windowed feed list (bonus: smooth scrolling at 1000+ messages). Uses the
 * *window* as the scroll container — the design scrolls the whole page, not
 * a boxed sub-panel — so only the cards near the viewport are ever mounted.
 * `measureElement` re-measures each card after render, since body length
 * varies the height row to row.
 */
export function MessageList({
  messages,
  currentUserId,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onUpdate,
  updatingId,
  onDelete,
  deletingId,
}: {
  messages: Message[];
  currentUserId: string;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  onUpdate?: (
    id: string,
    input: EditMessageInput,
    options?: { onSuccess?: () => void },
  ) => void;
  updatingId?: string;
  onDelete?: (id: string) => void;
  deletingId?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  // Refs can't be read during render, so the list's offset from the top of
  // the document — needed to translate window scroll position into
  // row-relative coordinates — is captured after mount instead.
  const [scrollMargin, setScrollMargin] = useState(0);
  useLayoutEffect(() => {
    setScrollMargin(listRef.current?.offsetTop ?? 0);
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: messages.length,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 6,
    scrollMargin,
  });

  return (
    <div>
      <div
        ref={listRef}
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((row) => {
          const message = messages[row.index];
          return (
            <div
              key={row.key}
              data-index={row.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 w-full pb-5"
              style={{
                transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)`,
              }}
            >
              <MessageCard
                message={message}
                isOwn={message.authorId === currentUserId}
                onUpdate={
                  onUpdate
                    ? (input, options) => onUpdate(message.id, input, options)
                    : undefined
                }
                isUpdating={updatingId === message.id}
                onDelete={onDelete ? () => onDelete(message.id) : undefined}
                isDeleting={deletingId === message.id}
              />
            </div>
          );
        })}
      </div>

      {hasNextPage && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            aria-busy={isFetchingNextPage}
            className="press inline-flex h-[46px] items-center justify-center border-[3px] border-ink bg-surface px-[26px] font-mono-ui text-[13px] font-bold uppercase shadow-hard-4 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more ↓'}
          </button>
        </div>
      )}
    </div>
  );
}
