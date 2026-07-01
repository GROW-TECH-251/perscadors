import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_SESSION_COOKIE = 'perscadors_admin_session';

function isAdminPath(pathname: string): boolean {
  const clean = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
  return clean === '/admin' || clean.startsWith('/admin/');
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const cleanPathname = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;

  if (!isAdminPath(cleanPathname)) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isLoginPath = cleanPathname === '/admin/login';

  if (!sessionCookie && !isLoginPath) {
    // CORRECTION CRITIQUE VERCEL EDGE (ULTIMATE VERSION) :
    // Construction explicite de l'URL absolue via request.nextUrl.origin pour forcer le pare-feu Vercel
    // Évite la corruption du routing manifest et esquive le cache CDN 404
    const loginUrl = new URL(`/admin/login?redirect=${encodeURIComponent(cleanPathname + search)}`, request.nextUrl.origin);
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
