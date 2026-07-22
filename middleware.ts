import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (!isAdminPath(pathname)) return NextResponse.next();

  const isLoginPath = pathname === '/admin/login';
  const response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    if (!isLoginPath) return NextResponse.redirect(new URL('/admin/login', request.url));
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies: Array<{ name: string; value: string; options: CookieOptions }>) => {
        cookies.forEach(({ name, value }) => request.cookies.set(name, value));
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    if (isLoginPath) return response;
    return NextResponse.redirect(new URL(`/admin/login?redirect=${encodeURIComponent(pathname + search)}`, request.url));
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';

  if (!isAdmin) {
    if (isLoginPath) return response;
    const loginUrl = new URL('/admin/login?reason=unauthorized', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPath) return NextResponse.redirect(new URL('/admin', request.url));

  response.headers.set('x-robots-tag', 'noindex, nofollow, noarchive');
  response.headers.set('cache-control', 'private, no-store, max-age=0');
  return response;
}

export const config = { matcher: ['/admin', '/admin/:path*'] };
