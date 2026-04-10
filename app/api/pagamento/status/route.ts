import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });

  const pedidoId = req.nextUrl.searchParams.get('pedido_id');
  if (!pedidoId) return NextResponse.json({ error: 'pedido_id obrigatorio' }, { status: 400 });

  const { rows: [pedido] } = await db.query(
    `SELECT id, status, receipt_url, infinitepay_transaction_nsu, valor_total
     FROM pedidos WHERE id = $1 AND usuario_id = $2`,
    [Number(pedidoId), Number(user.id)]
  );

  if (!pedido) return NextResponse.json({ error: 'Pedido nao encontrado' }, { status: 404 });

  return NextResponse.json({
    status: pedido.status,
    receipt_url: pedido.receipt_url,
    transaction_nsu: pedido.infinitepay_transaction_nsu,
    valor_total: pedido.valor_total,
  });
}
