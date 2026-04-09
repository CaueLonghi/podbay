const SESSION_COOKIE = 'podbay_session';

// Rotas públicas — não precisam de sessão
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/cart',
  '/profile',
  '/api/auth/login',
  '/api/auth/register',
  '/api/catalogo',
];

function next(): Response {
  return new Response(null, {
    status: 200,
    headers: { 'x-middleware-next': '1' },
  });
}

export function middleware(req: Request): Response {
  const { pathname } = new URL(req.url);

  // Passa direto para assets e rotas públicas
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/')) || pathname === '/') {
    return next();
  }

  const cookieHeader = req.headers.get('cookie') ?? '';
  const hasSession = cookieHeader
    .split(';')
    .some((c) => c.trim().startsWith(`${SESSION_COOKIE}=`));

  // API routes têm verificação própria via getSessionUser() — deixa passar
  if (pathname.startsWith('/api/')) {
    return next();
  }

  if (!hasSession) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return Response.redirect(loginUrl.toString(), 307);
  }

  return next();
}

export const config = {
  // Exclui assets estáticos do Next.js — só roda em páginas e API routes
  matcher: ['/((?!_next/static|_next/image|favicon.ico|brands/|logos/).*)'],
};
