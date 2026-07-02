import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_SESSION_COOKIE = 'perscadors_admin_session';

function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

/**
 * Middleware de protection des routes admin.
 * - Redirige vers /admin/login si non authentifié
 * - Redirige vers /admin si déjà authentifié sur /admin/login
 * - Ajoute en-têtes de sécurité pour les routes admin
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isAdminPath(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isLoginPath = pathname === '/admin/login';

  if (!sessionCookie && !isLoginPath) {
    const loginUrl = new URL(
      `/admin/login?redirect=${encodeURIComponent(pathname + search)}`,
      request.nextUrl.origin
    );
    return NextResponse.redirect(loginUrl);
  }

  if (sessionCookie && isLoginPath) {
    const dashboardUrl = new URL('/admin', request.nextUrl.origin);
    return NextResponse.redirect(dashboardUrl);
  }

  const response = NextResponse.next();

  if (!isLoginPath) {
    response.headers.set('x-robots-tag', 'noindex, nofollow, noarchive');
    response.headers.set('cache-control', 'private, no-store, max-age=0');
  }

  return response;
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
