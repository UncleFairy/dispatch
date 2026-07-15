import { describe, it, expect } from 'vitest';
import { createSessionToken, verifySessionToken } from '@/server/auth/session';

describe('createSessionToken / verifySessionToken', () => {
  it('round-trips a valid token back to its userId', async () => {
    const token = await createSessionToken('u_ada');
    expect(await verifySessionToken(token)).toBe('u_ada');
  });

  it('rejects a token whose signature was tampered with', async () => {
    const token = await createSessionToken('u_ada');
    const [userId, signature] = token.split('.');
    const flipped = signature.slice(0, -1) + (signature.at(-1) === 'a' ? 'b' : 'a');
    expect(await verifySessionToken(`${userId}.${flipped}`)).toBeNull();
  });

  it("rejects a token forged with a different userId but another token's signature", async () => {
    const adaToken = await createSessionToken('u_ada');
    const signature = adaToken.split('.')[1];
    expect(await verifySessionToken(`u_marco.${signature}`)).toBeNull();
  });

  it('rejects malformed tokens (no separator, empty)', async () => {
    expect(await verifySessionToken('not-a-real-token')).toBeNull();
    expect(await verifySessionToken('')).toBeNull();
    expect(await verifySessionToken(undefined)).toBeNull();
    expect(await verifySessionToken(null)).toBeNull();
  });

  it('produces distinct signatures for distinct user ids', async () => {
    const a = await createSessionToken('u_ada');
    const b = await createSessionToken('u_marco');
    expect(a).not.toBe(b);
  });
});
