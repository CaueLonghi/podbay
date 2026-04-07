import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const enderecoId = Number(params.id);
  if (!enderecoId) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  // Garante que o endereço pertence ao usuário
  const [ownerCheck] = await db.query(
    'SELECT id FROM enderecos WHERE id = ? AND usuario_id = ? LIMIT 1',
    [enderecoId, user.id]
  ) as [Array<{ id: number }>, unknown];

  if (ownerCheck.length === 0) {
    return NextResponse.json({ error: 'Endereço não encontrado' }, { status: 404 });
  }

  // Troca: remove principal de todos, seta no selecionado
  await db.query('UPDATE enderecos SET principal = 0 WHERE usuario_id = ?', [user.id]);
  await db.query('UPDATE enderecos SET principal = 1 WHERE id = ? AND usuario_id = ?', [enderecoId, user.id]);

  return NextResponse.json({ ok: true });
}
