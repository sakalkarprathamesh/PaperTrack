import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, Next internals, api, favicon, and login
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/login' ||
    pathname === '/unauthorized' ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  // Get authenticated role from cookie
  const userRole = request.cookies.get('papertrack_role')?.value;

  // 1. ADMIN ROUTES GUARD
  if (pathname.startsWith('/admin')) {
    if (!userRole) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // 2. DELIVERY STAFF ROUTES GUARD
  if (pathname.startsWith('/delivery')) {
    if (!userRole) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== 'DELIVERY_BOY' && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // 3. CUSTOMER ROUTES GUARD
  if (pathname.startsWith('/customer')) {
    if (!userRole) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== 'CUSTOMER' && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // Add security headers to response
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Prevent search engine indexing on private portals
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/delivery') ||
    pathname.startsWith('/customer')
  ) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
