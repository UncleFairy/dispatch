import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

/** Multi-line field for the composer. Non-resizable to keep the layout stable. */
export const TextArea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function TextArea({ className, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'w-full resize-none border-[2.5px] border-ink bg-surface p-4 text-base outline-none',
        className,
      )}
      {...props}
    />
  );
});
