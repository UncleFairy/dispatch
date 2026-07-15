'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { TAGS, type Tag } from '@/lib/schemas';

/**
 * Compact "TAG: X ▾" control (design 02). A native <select> can't be styled
 * to match the neo-brutalist look — the browser renders its open list itself
 * — so this is a small custom listbox: a trigger button plus an absolutely
 * positioned option list, closed on outside click, Escape, or selection.
 */
export function TagSelect({
  value,
  onChange,
  id,
}: {
  value: Tag;
  onChange: (tag: Tag) => void;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="press inline-flex h-[38px] w-[140px] items-center gap-1.5 border-2 border-ink bg-surface px-3 font-mono-ui text-xs font-bold uppercase"
      >
        <span className="text-muted">Tag:</span>
        <span>{value}</span>
        <span aria-hidden>▾</span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Tag"
          className="absolute top-[calc(100%+4px)] left-0 z-10 w-[140px] border-2 border-ink bg-surface shadow-hard-3"
        >
          {TAGS.map((t) => (
            <button
              key={t}
              type="button"
              role="option"
              aria-selected={t === value}
              onClick={() => {
                onChange(t);
                setOpen(false);
              }}
              className={cn(
                'block w-full border-b-2 border-ink px-3 py-2 text-left font-mono-ui text-xs font-bold uppercase last:border-b-0',
                t === value ? 'bg-accent' : 'bg-surface hover:bg-paper',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
