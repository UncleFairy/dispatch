/**
 * Time formatting for the feed. Pure functions, safe on server and client.
 * `now` is injectable so output is deterministic in tests.
 */

/** Compact relative label for message cards: "now", "2m", "1h", "3d", "2w". */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return '';

  const seconds = Math.max(0, Math.floor((now - then) / 1000));
  if (seconds < 45) return 'now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;

  // Older than a month → short absolute date.
  return new Date(then).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Full timestamp for tooltips and the `<time dateTime>` accessible label. */
export function absoluteTime(iso: string): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return '';
  return new Date(then).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
