import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { rows } = await db.query(
    'SELECT id, username, nome_completo, email, telefone, is_admin, created_at FROM usuarios WHERE id = $1 AND ativo = true LIMIT 1',
    [user.id]
  );

  if (!rows[0]) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  return NextResponse.json({ user: rows[0] });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { email, telefone, senha_atual, nova_senha } = await req.json();

  if (!email || !telefone) {
    return NextResponse.json({ error: 'E-mail e telefone são obrigatórios' }, { status: 400 });
  }

  // Verifica duplicidade de e-mail (excluindo o próprio usuário)
  const { rows: emailRows } = await db.query(
    'SELECT id FROM usuarios WHERE email = $1 AND id <> $2 LIMIT 1',
    [email, user.id]
  );
  if (emailRows.length > 0) {
    return NextResponse.json({ error: 'Este e-mail já está em uso' }, { status: 409 });
  }

  // Verifica duplicidade de telefone
  const { rows: phoneRows } = await db.query(
    'SELECT id FROM usuarios WHERE telefone = $1 AND id <> $2 LIMIT 1',
    [telefone, user.id]
  );
  if (phoneRows.length > 0) {
    return NextResponse.json({ error: 'Este telefone já está em uso' }, { status: 409 });
  }

  // Troca de senha (opcional)
  if (nova_senha !== undefined && nova_senha !== '') {
    if (!senha_atual) {
      return NextResponse.json({ error: 'Informe a senha atual para alterá-la' }, { status: 400 });
    }
    if (nova_senha.length < 6) {
      return NextResponse.json({ error: 'A nova senha deve ter pelo menos 6 caracteres' }, { status: 400 });
    }
    const { rows: [u] } = await db.query('SELECT password_hash FROM usuarios WHERE id = $1', [user.id]);
    const ok = await bcrypt.compare(senha_atual, u.password_hash);
    if (!ok) {
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 403 });
    }
    const hash = await bcrypt.hash(nova_senha, 10);
    await db.query(
      'UPDATE usuarios SET email = $1, telefone = $2, password_hash = $3 WHERE id = $4',
      [email, telefone, hash, user.id]
    );
  } else {
    await db.query(
      'UPDATE usuarios SET email = $1, telefone = $2 WHERE id = $3',
      [email, telefone, user.id]
    );
  }

  return NextResponse.json({ ok: true });
}
