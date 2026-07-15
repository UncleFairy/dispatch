import { cn } from '@/lib/cn';

/**
 * Square initial-avatar. Decorative (`aria-hidden`) because the author's name is
 * always shown as real text beside it — no need to announce the letter twice.
 */
export type AvatarProps = {
  initial: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'accent' | 'surface';
  className?: string;
};

const sizes = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-[38px] w-[38px] text-base',
  lg: 'h-12 w-12 text-lg',
} as const;

export function Avatar({
  initial,
  size = 'md',
  tone = 'accent',
  className,
}: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex items-center justify-center border-2 border-ink font-mono-ui font-bold',
        sizes[size],
        tone === 'accent' ? 'bg-accent' : 'bg-surface',
        className,
      )}
    >
      {initial}
    </span>
  );
}
