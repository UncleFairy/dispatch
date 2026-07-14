import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

/**
 * A styled *native* <select> — native is keyboard- and screen-reader-accessible
 * for free, so we only restyle it (hiding the OS arrow and drawing our own ▾).
 * Pass `aria-label` or associate a <label> for an accessible name.
 */
export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'h-12 w-full appearance-none border-[2.5px] border-ink bg-surface pr-10 pl-4 text-base outline-none',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-mono-ui text-sm"
      >
        ▾
      </span>
    </div>
  );
});
