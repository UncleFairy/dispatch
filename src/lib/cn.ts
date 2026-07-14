import { twMerge } from 'tailwind-merge';

/**
 * Join class names, then resolve Tailwind conflicts so a caller-supplied class
 * reliably wins over a component default (e.g. `bg-surface` overriding
 * `bg-accent`). Keeps component APIs override-friendly without specificity hacks.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return twMerge(parts.filter(Boolean).join(' '));
}
