/**
 * Stateless session tokens: an HMAC signature over the user id, carried in an
 * httpOnly cookie. Implemented with Web Crypto (not node:crypto) so the exact
 * same code runs in both the Node route handlers and the Edge proxy. No
 * node-only APIs and no repository imports live here, keeping it Edge-safe.
 */
import type { NextResponse } from 'next/server';

export const SESSION_COOKIE = 'dispatch_session';

// A dev fallback keeps the app runnable with zero setup; real deployments set
// SESSION_SECRET (see .env.example). Signatures are only as strong as this key.
const SECRET = process.env.SESSION_SECRET ?? 'dev-insecure-secret-change-me';
const encoder = new TextEncoder();

let keyPromise: Promise<CryptoKey> | null = null;
function getKey(): Promise<CryptoKey> {
  keyPromise ??= crypto.subtle.importKey(
    'raw',
    encoder.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return keyPromise;
}

function base64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sign(value: string): Promise<string> {
  const signature = await crypto.subtle.sign(
    'HMAC',
    await getKey(),
    encoder.encode(value),
  );
  return base64url(signature);
}

/** Constant-time comparison so an attacker can't probe the signature via timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

export async function createSessionToken(userId: string): Promise<string> {
  return `${userId}.${await sign(userId)}`;
}

/** Returns the userId if the token's signature is valid, otherwise null. */
export async function verifySessionToken(
  token: string | undefined | null,
): Promise<string | null> {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const userId = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  return safeEqual(signature, await sign(userId)) ? userId : null;
}

const cookieOptions = {
  httpOnly: true, // JS can't read it → XSS-safe
  sameSite: 'lax' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

export async function setSessionCookie(res: NextResponse, userId: string): Promise<void> {
  res.cookies.set(SESSION_COOKIE, await createSessionToken(userId), cookieOptions);
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, '', { ...cookieOptions, maxAge: 0 });
}
