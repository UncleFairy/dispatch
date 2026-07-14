import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

/**
 * The neo-brutalist button: 3px ink border, solid offset shadow, mono uppercase
 * label, and the `press` sink-on-click interaction. No `'use client'` — it's a
 * presentational wrapper, so it renders on whichever side its consumer lives on.
 */
const base =
  'inline-flex items-center justify-center gap-2 border-[3px] border-ink font-mono-ui font-bold uppercase tracking-wide press select-none disabled:cursor-not-allowed disabled:border-ink disabled:bg-disabled disabled:text-disabled-ink disabled:shadow-none';

const variants = {
  primary: 'bg-accent text-ink shadow-hard-5',
  secondary: 'bg-surface text-ink shadow-hard-4',
  ghost: 'border-transparent bg-transparent px-0 shadow-none hover:underline',
} as const;

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-11 px-4 text-sm',
  lg: 'h-14 px-6 text-base',
} as const;

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', type = 'button', className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
});
