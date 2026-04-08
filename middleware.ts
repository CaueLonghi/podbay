import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'podbay_session';

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/catalogo',
  '/cart',
  '/profile',
];

export function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url);

  if (
    pathname === '/' ||
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/brands/')
  ) {
    return NextResponse.next();
  }

  const session = req.cookies.get(SESSION_COOKIE);

  if (!session?.value) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
