/** One placeholder card matching a real `MessageCard`'s bones (design 03). */
function SkeletonCard() {
  return (
    <div className="border-[3px] border-ink bg-surface p-3.5 md:p-[18px]">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 shrink-0 animate-skeleton bg-skeleton md:h-[38px] md:w-[38px]" />
        <div className="flex-1">
          <div className="h-3 w-[140px] animate-skeleton bg-skeleton" />
          <div className="mt-2 h-2.5 w-[90px] animate-skeleton bg-skeleton" />
        </div>
      </div>
      <div className="mt-4 h-3 w-full animate-skeleton bg-skeleton" />
      <div className="mt-2 h-3 w-4/5 animate-skeleton bg-skeleton" />
      <div className="mt-4 h-[22px] w-[90px] animate-skeleton bg-skeleton" />
    </div>
  );
}

/**
 * Shown in place of the message list while its query has no data yet
 * (design 03). Not virtualized — it's a fixed handful of placeholder cards,
 * never 1000+ rows.
 */
export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-5" role="presentation" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
