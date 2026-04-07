import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth-config';

// Rotas que não precisam de autenticação
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
  const { pathname } = req.nextUrl;

  // Deixa passar rotas públicas e assets estáticos
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
