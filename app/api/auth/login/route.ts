import { NextRequest, NextResponse } from 'next/server';
import { validateCredentials } from '@/lib/auth';
import { SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth-config';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 400 });
  }

  const user = await validateCredentials(username, password);

  if (!user) {
    return NextResponse.json({ error: 'Usuário ou senha incorretos' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, user: { id: user.id, username: user.username } });

  // Cookie httpOnly — não acessível via JS, protegido contra XSS
  response.cookies.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  return response;
}
