import { describe, it, expect } from 'vitest';
import { absoluteTime, relativeTime } from '@/lib/time';

const NOW = Date.UTC(2026, 0, 1, 12, 0, 0);
const secondsAgo = (s: number) => new Date(NOW - s * 1000).toISOString();

describe('relativeTime', () => {
  it('reads as "now" for anything under 45 seconds', () => {
    expect(relativeTime(secondsAgo(0), NOW)).toBe('now');
    expect(relativeTime(secondsAgo(44), NOW)).toBe('now');
  });

  it('buckets into minutes once past 45 seconds', () => {
    expect(relativeTime(secondsAgo(45), NOW)).toBe('0m');
    expect(relativeTime(secondsAgo(2 * 60), NOW)).toBe('2m');
    expect(relativeTime(secondsAgo(59 * 60), NOW)).toBe('59m');
  });

  it('buckets into hours once past 60 minutes', () => {
    expect(relativeTime(secondsAgo(60 * 60), NOW)).toBe('1h');
    expect(relativeTime(secondsAgo(23 * 60 * 60), NOW)).toBe('23h');
  });

  it('buckets into days once past 24 hours', () => {
    expect(relativeTime(secondsAgo(24 * 60 * 60), NOW)).toBe('1d');
    expect(relativeTime(secondsAgo(6 * 24 * 60 * 60), NOW)).toBe('6d');
  });

  it('buckets into weeks once past 7 days, up to 4', () => {
    expect(relativeTime(secondsAgo(7 * 24 * 60 * 60), NOW)).toBe('1w');
    expect(relativeTime(secondsAgo(4 * 7 * 24 * 60 * 60), NOW)).toBe('4w');
  });

  it('falls back to a short absolute date past ~5 weeks', () => {
    const iso = secondsAgo(6 * 7 * 24 * 60 * 60);
    const result = relativeTime(iso, NOW);
    expect(result).not.toMatch(/w$/);
    expect(result.length).toBeGreaterThan(0);
  });

  it('never goes negative for a timestamp in the future', () => {
    expect(relativeTime(new Date(NOW + 10_000).toISOString(), NOW)).toBe('now');
  });

  it('returns an empty string for an unparseable date', () => {
    expect(relativeTime('not-a-date', NOW)).toBe('');
  });
});

describe('absoluteTime', () => {
  it('formats a valid ISO timestamp to a non-empty string', () => {
    expect(absoluteTime(secondsAgo(0))).not.toBe('');
  });

  it('returns an empty string for an unparseable date', () => {
    expect(absoluteTime('not-a-date')).toBe('');
  });
});
