import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth-config';
import type mysql from 'mysql2/promise';

export async function POST(req: NextRequest) {
  const { nome_completo, email, telefone, password } = await req.json();

  if (!nome_completo || !email || !telefone || !password) {
    return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 });
  }

  // Verifica e-mail duplicado
  const [emailRows] = await db.query<mysql.RowDataPacket[]>(
    'SELECT id FROM usuarios WHERE email = ? LIMIT 1',
    [email]
  );
  if (emailRows.length > 0) {
    return NextResponse.json({ error: 'Este e-mail já está cadastrado' }, { status: 409 });
  }

  // Verifica telefone duplicado
  const [phoneRows] = await db.query<mysql.RowDataPacket[]>(
    'SELECT id FROM usuarios WHERE telefone = ? LIMIT 1',
    [telefone]
  );
  if (phoneRows.length > 0) {
    return NextResponse.json({ error: 'Este telefone já está cadastrado' }, { status: 409 });
  }

  // Gera username a partir do e-mail (parte antes do @)
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
  const [countRows] = await db.query<mysql.RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM usuarios WHERE username LIKE ?',
    [`${base}%`]
  );
  const total = (countRows[0] as { total: number }).total;
  const username = total > 0 ? `${base}${total + 1}` : base;

  const password_hash = await bcrypt.hash(password, 10);

  const [result] = await db.query<mysql.ResultSetHeader>(
    'INSERT INTO usuarios (username, nome_completo, email, telefone, password_hash) VALUES (?, ?, ?, ?, ?)',
    [username, nome_completo, email, telefone, password_hash]
  );

  const userId = String(result.insertId);

  const response = NextResponse.json({ ok: true, user: { id: userId, username, role: 'user' } });

  response.cookies.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  return response;
}
