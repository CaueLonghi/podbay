import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

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
