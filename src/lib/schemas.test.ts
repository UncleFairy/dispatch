import { describe, it, expect } from 'vitest';
import {
  CreateMessageInput,
  EditMessageInput,
  MessagesQuerySchema,
  TagSchema,
  LoginInput,
  MAX_BODY,
  MIN_BODY,
} from '@/lib/schemas';

describe('CreateMessageInput', () => {
  it('accepts a valid message and trims the body', () => {
    const parsed = CreateMessageInput.parse({ body: '  hello there  ', tag: 'PRODUCT' });
    expect(parsed.body).toBe('hello there');
  });

  it('rejects an empty (or whitespace-only) body', () => {
    expect(CreateMessageInput.safeParse({ body: '   ', tag: 'PRODUCT' }).success).toBe(
      false,
    );
  });

  it('enforces the 10-character minimum', () => {
    expect(
      CreateMessageInput.safeParse({ body: 'x'.repeat(MIN_BODY - 1), tag: 'DESIGN' })
        .success,
    ).toBe(false);
    expect(
      CreateMessageInput.safeParse({ body: 'x'.repeat(MIN_BODY), tag: 'DESIGN' }).success,
    ).toBe(true);
  });

  it('enforces the 240-character boundary', () => {
    expect(
      CreateMessageInput.safeParse({ body: 'x'.repeat(MAX_BODY), tag: 'DESIGN' }).success,
    ).toBe(true);
    expect(
      CreateMessageInput.safeParse({ body: 'x'.repeat(MAX_BODY + 1), tag: 'DESIGN' })
        .success,
    ).toBe(false);
  });

  it('rejects an unknown tag', () => {
    expect(CreateMessageInput.safeParse({ body: 'hi', tag: 'NOPE' }).success).toBe(false);
  });
});

describe('EditMessageInput', () => {
  it('accepts body-only or tag-only edits', () => {
    expect(EditMessageInput.safeParse({ body: 'updated body' }).success).toBe(true);
    expect(EditMessageInput.safeParse({ tag: 'RANDOM' }).success).toBe(true);
  });

  it('rejects an empty patch (nothing to update)', () => {
    expect(EditMessageInput.safeParse({}).success).toBe(false);
  });
});

describe('TagSchema', () => {
  it('accepts the four known tags and nothing else', () => {
    for (const tag of ['PRODUCT', 'DESIGN', 'RANDOM', 'ANNOUNCE']) {
      expect(TagSchema.safeParse(tag).success).toBe(true);
    }
    expect(TagSchema.safeParse('OTHER').success).toBe(false);
  });
});

describe('MessagesQuerySchema', () => {
  it('defaults limit to 20 when absent', () => {
    expect(MessagesQuerySchema.parse({}).limit).toBe(20);
  });

  it('coerces limit from its string (URL) form', () => {
    expect(MessagesQuerySchema.parse({ limit: '30' }).limit).toBe(30);
  });

  it('rejects an out-of-range limit', () => {
    expect(MessagesQuerySchema.safeParse({ limit: '0' }).success).toBe(false);
    expect(MessagesQuerySchema.safeParse({ limit: '500' }).success).toBe(false);
  });

  it('rejects an unparseable date', () => {
    expect(MessagesQuerySchema.safeParse({ from: 'not-a-date' }).success).toBe(false);
    expect(MessagesQuerySchema.safeParse({ from: '2026-01-01' }).success).toBe(true);
  });
});

describe('LoginInput', () => {
  it('requires a valid email and a non-empty password', () => {
    expect(
      LoginInput.safeParse({ email: 'ada@dispatch.dev', password: 'x' }).success,
    ).toBe(true);
    expect(LoginInput.safeParse({ email: 'nope', password: 'x' }).success).toBe(false);
    expect(
      LoginInput.safeParse({ email: 'ada@dispatch.dev', password: '' }).success,
    ).toBe(false);
  });
});
