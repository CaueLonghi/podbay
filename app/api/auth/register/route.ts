import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth-config';
import { validarNome, validarEmail, validarTelefone } from '@/lib/validacoes';

export async function POST(req: NextRequest) {
  const { nome_completo, email, telefone, password } = await req.json();

  const erroNome     = validarNome(nome_completo ?? '');
  const erroEmail    = validarEmail(email ?? '');
  const erroTelefone = validarTelefone(telefone ?? '');

  if (erroNome)     return NextResponse.json({ error: erroNome }, { status: 400 });
  if (erroEmail)    return NextResponse.json({ error: erroEmail }, { status: 400 });
  if (erroTelefone) return NextResponse.json({ error: erroTelefone }, { status: 400 });
  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 });
  }

  // Duplicidade: e-mail
  const { rows: emailRows } = await db.query(
    'SELECT id FROM usuarios WHERE email = $1 LIMIT 1',
    [email.trim()]
  );
  if (emailRows.length > 0) return NextResponse.json({ error: 'Este e-mail já está cadastrado' }, { status: 409 });

  // Duplicidade: telefone
  const { rows: phoneRows } = await db.query(
    'SELECT id FROM usuarios WHERE telefone = $1 LIMIT 1',
    [telefone]
  );
  if (phoneRows.length > 0) return NextResponse.json({ error: 'Este telefone já está cadastrado' }, { status: 409 });

  // Gera username a partir do e-mail
  const base = email.trim().split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
  const { rows: countRows } = await db.query(
    'SELECT COUNT(*) AS total FROM usuarios WHERE username LIKE $1',
    [`${base}%`]
  );
  const total = Number(countRows[0].total);
  const username = total > 0 ? `${base}${total + 1}` : base;

  const password_hash = await bcrypt.hash(password, 10);

  const { rows: [newUser] } = await db.query(
    'INSERT INTO usuarios (username, nome_completo, email, telefone, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [username, nome_completo.trim(), email.trim(), telefone, password_hash]
  );

  const userId = String(newUser.id);
  const response = NextResponse.json({ ok: true, user: { id: userId, username } });

  response.cookies.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  return response;
}
