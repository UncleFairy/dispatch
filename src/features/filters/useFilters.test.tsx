// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSyncExternalStore } from 'react';

/**
 * A minimal, reactive stand-in for next/navigation: a single mutable
 * "current URL" that useSearchParams/usePathname subscribe to via
 * useSyncExternalStore, and router.push mutates + notifies. That's enough to
 * exercise useFilters' read/write round-trip without a real Next.js router.
 */
let pathname = '/feed';
let search = new URLSearchParams();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

function applyUrl(url: string) {
  const [p, q = ''] = url.split('?');
  pathname = p;
  search = new URLSearchParams(q);
  notify();
}

vi.mock('next/navigation', () => ({
  useSearchParams: () => useSyncExternalStore(subscribe, () => search),
  usePathname: () => useSyncExternalStore(subscribe, () => pathname),
  useRouter: () => ({
    push: (url: string) => applyUrl(url),
  }),
}));

const { useFilters } = await import('@/features/filters/useFilters');

beforeEach(() => {
  applyUrl('/feed');
});

describe('useFilters', () => {
  it('reads empty filters from a bare URL', () => {
    const { result } = renderHook(() => useFilters());
    expect(result.current.filters).toEqual({
      tag: undefined,
      userId: undefined,
      from: undefined,
      to: undefined,
    });
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('reads filters that are already present in the URL', () => {
    applyUrl('/feed?tag=DESIGN&userId=u_marco&from=2026-01-01&to=2026-01-31');
    const { result } = renderHook(() => useFilters());
    expect(result.current.filters).toEqual({
      tag: 'DESIGN',
      userId: 'u_marco',
      from: '2026-01-01',
      to: '2026-01-31',
    });
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('drops an unknown tag value instead of surfacing it', () => {
    applyUrl('/feed?tag=NOT_A_TAG');
    const { result } = renderHook(() => useFilters());
    expect(result.current.filters.tag).toBeUndefined();
  });

  it('setParam writes a filter into the URL and the hook picks it up', () => {
    const { result } = renderHook(() => useFilters());
    act(() => result.current.setParam('tag', 'PRODUCT'));
    expect(result.current.filters.tag).toBe('PRODUCT');
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('setParam with null removes the key, restoring the bare path once empty', () => {
    applyUrl('/feed?tag=PRODUCT');
    const { result } = renderHook(() => useFilters());
    act(() => result.current.setParam('tag', null));
    expect(result.current.filters.tag).toBeUndefined();
    expect(result.current.hasActiveFilters).toBe(false);
    expect(pathname + (search.size ? `?${search}` : '')).toBe('/feed');
  });

  it('setParam preserves other existing filters (round-trips multiple keys)', () => {
    applyUrl('/feed?tag=PRODUCT&userId=u_ada');
    const { result } = renderHook(() => useFilters());
    act(() => result.current.setParam('from', '2026-02-01'));
    expect(result.current.filters).toEqual({
      tag: 'PRODUCT',
      userId: 'u_ada',
      from: '2026-02-01',
      to: undefined,
    });
  });

  it('clear removes every filter at once', () => {
    applyUrl('/feed?tag=PRODUCT&userId=u_ada&from=2026-01-01&to=2026-01-31');
    const { result } = renderHook(() => useFilters());
    act(() => result.current.clear());
    expect(result.current.filters).toEqual({
      tag: undefined,
      userId: undefined,
      from: undefined,
      to: undefined,
    });
    expect(result.current.hasActiveFilters).toBe(false);
  });
});
