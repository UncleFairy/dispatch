import { cn } from '@/lib/cn';

/** A bordered surface panel with an optional solid offset shadow. */
export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  shadow?: 'none' | 'sm' | 'md' | 'lg';
};

const shadowMap = {
  none: '',
  sm: 'shadow-hard-2',
  md: 'shadow-hard-4',
  lg: 'shadow-hard-6',
} as const;

export function Card({ shadow = 'md', className, ...props }: CardProps) {
  return (
    <div
      className={cn('border-[3px] border-ink bg-surface', shadowMap[shadow], className)}
      {...props}
    />
  );
}
