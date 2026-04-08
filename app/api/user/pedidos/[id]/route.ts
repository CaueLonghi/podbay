import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });

  const { id: rawId } = await params;
  const pedidoId = Number(rawId);

  const { rows } = await db.query(
    "SELECT id, status FROM pedidos WHERE id = $1 AND usuario_id = $2 LIMIT 1",
    [pedidoId, Number(user.id)]
  );

  if (rows.length === 0) return NextResponse.json({ error: 'Pedido nao encontrado' }, { status: 404 });
  if (rows[0].status !== 'pendente') return NextResponse.json({ error: 'Apenas pedidos pendentes podem ser cancelados' }, { status: 400 });

  await db.query("UPDATE pedidos SET status = 'cancelado' WHERE id = $1", [pedidoId]);
  return NextResponse.json({ ok: true });
}
