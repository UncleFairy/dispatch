/**
 * "Nothing here yet" (design 03): a dashed hazard-striped card shown when a
 * filter combination (or a brand-new feed) has zero messages. Distinct from
 * `LoadingSkeleton` — this renders only once the fetch has settled and come
 * back empty, never while data is still in flight.
 */
export function EmptyState() {
  return (
    <div className="bg-empty-stripes flex min-h-[280px] flex-1 flex-col items-center justify-center border-[3px] border-dashed border-ink p-6 text-center md:min-h-[420px] md:p-10">
      <div className="flex h-14 w-14 items-center justify-center border-[3px] border-ink bg-accent text-[28px] font-bold shadow-hard-3 md:h-[72px] md:w-[72px] md:text-[34px] md:shadow-hard-4">
        !
      </div>
      <p className="mt-[18px] text-[19px] font-bold md:mt-6 md:text-2xl">
        Nothing here yet
      </p>
      <p className="mt-2 max-w-[360px] text-xs leading-relaxed text-muted md:text-sm">
        No messages match this view. Post the first one, or clear your filters.
      </p>
    </div>
  );
}
