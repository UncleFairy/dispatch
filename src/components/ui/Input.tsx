import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

/** Single-line field: 2.5px ink border on a white surface, no rounding. */
export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, type = 'text', ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'h-12 w-full border-[2.5px] border-ink bg-surface px-4 text-base outline-none',
        className,
      )}
      {...props}
    />
  );
});
