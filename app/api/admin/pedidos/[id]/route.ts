import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: rawId } = await params;
  const id = Number(rawId);
  const body = await req.json();
  const { status } = body;

  const allowed = ['pendente', 'pago', 'enviado', 'entregue', 'cancelado'];
  if (!status || !allowed.includes(status)) {
    return NextResponse.json({ error: 'Status invalido' }, { status: 400 });
  }

  // Se for cancelar, restaura estoque (só se ainda não estava cancelado)
  if (status === 'cancelado') {
    const { rows: [atual] } = await db.query('SELECT status FROM pedidos WHERE id = $1', [id]);
    if (atual && atual.status !== 'cancelado') {
      const { rows: itens } = await db.query(
        'SELECT produto_id, quantidade FROM itens_pedido WHERE pedido_id = $1 AND produto_id IS NOT NULL',
        [id]
      );
      if (itens.length > 0) {
        await Promise.all(
          itens.map((i: { produto_id: number; quantidade: number }) =>
            db.query(
              'UPDATE catalogo SET estoque = estoque + $1 WHERE id = $2',
              [i.quantidade, i.produto_id]
            )
          )
        );
      }
    }
  }

  await db.query('UPDATE pedidos SET status = $1 WHERE id = $2', [status, id]);
  return NextResponse.json({ ok: true });
}
