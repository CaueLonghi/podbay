import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const enderecoId = Number(params.id);
  if (!enderecoId) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  // Garante que o endereço pertence ao usuário
  const { rows: ownerCheck } = await db.query(
    'SELECT id FROM enderecos WHERE id = $1 AND usuario_id = $2 LIMIT 1',
    [enderecoId, user.id]
  );

  if (ownerCheck.length === 0) {
    return NextResponse.json({ error: 'Endereço não encontrado' }, { status: 404 });
  }

  // Troca: remove principal de todos, seta no selecionado
  await db.query('UPDATE enderecos SET principal = false WHERE usuario_id = $1', [user.id]);
  await db.query('UPDATE enderecos SET principal = true WHERE id = $1 AND usuario_id = $2', [enderecoId, user.id]);

  return NextResponse.json({ ok: true });
}
