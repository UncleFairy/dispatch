import { cn } from '@/lib/cn';

/**
 * A tag chip. `active` fills it with the accent and bolds it (used for a
 * selected filter); otherwise it's a plain outlined chip (used to label a
 * message). Presentational only — the interactive filter wraps/decorates it.
 */
export type TagPillProps = React.HTMLAttributes<HTMLSpanElement> & {
  active?: boolean;
};

export function TagPill({ active = false, className, children, ...props }: TagPillProps) {
  return (
    <span
      className={cn(
        'inline-block border-2 border-ink px-2.5 py-1 font-mono-ui text-xs',
        active ? 'bg-accent font-bold' : 'bg-surface',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
