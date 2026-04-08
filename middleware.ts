// Sem imports de next/server — usa apenas Web APIs nativas do Edge Runtime
// NextResponse.next() internamente usa o header x-middleware-next: 1
// NextResponse.redirect() internamente usa Response.redirect()

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

function next(): Response {
  return new Response(null, { headers: { 'x-middleware-next': '1' } });
}

export function middleware(req: Request) {
  const { pathname } = new URL(req.url);

  if (
    pathname === '/' ||
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/brands/')
  ) {
    return next();
  }

  // Lê o cookie manualmente sem usar NextRequest
  const cookieHeader = req.headers.get('cookie') ?? '';
  const hasSession = cookieHeader
    .split(';')
    .some((c) => c.trim().startsWith(`${SESSION_COOKIE}=`));

  if (!hasSession) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return Response.redirect(loginUrl.toString(), 307);
  }

  return next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
