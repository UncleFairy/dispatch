import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/server/auth/session';

/**
 * Proxy (Next 16's renamed middleware). Runs before protected routes render and
 * gates them on a valid session cookie: unauthenticated visitors are bounced to
 * /login (remembering where they were headed), and already-authenticated users
 * are kept out of /login. Verifying the HMAC here rejects forged cookies before
 * any page work happens; the route handlers enforce authz again (defense in depth).
 */
export async function proxy(req: NextRequest) {
  const userId = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  const { pathname } = req.nextUrl;
  const onLogin = pathname === '/login';

  if (!userId && !onLogin) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (userId && onLogin) {
    const url = req.nextUrl.clone();
    url.pathname = '/feed';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Only run on the app routes that need gating — never on /api or static assets.
export const config = {
  matcher: ['/feed/:path*', '/login'],
};
