import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });

  const orderNsu = req.nextUrl.searchParams.get('order_nsu');
  if (!orderNsu) return NextResponse.json({ error: 'order_nsu obrigatorio' }, { status: 400 });

  // Busca pedido criado pelo webhook (via checkout_nsu)
  const { rows: [pedido] } = await db.query(
    `SELECT id, status, receipt_url, infinitepay_transaction_nsu, valor_total
     FROM pedidos WHERE checkout_nsu = $1 AND usuario_id = $2`,
    [orderNsu, Number(user.id)]
  );

  if (pedido) {
    return NextResponse.json({
      status: pedido.status,
      receipt_url: pedido.receipt_url,
      transaction_nsu: pedido.infinitepay_transaction_nsu,
      valor_total: pedido.valor_total,
    });
  }

  // Sessão ainda existe → aguardando webhook
  const { rows: [sessao] } = await db.query(
    'SELECT id FROM checkout_sessions WHERE id = $1 AND usuario_id = $2',
    [orderNsu, Number(user.id)]
  );

  if (sessao) {
    return NextResponse.json({ status: 'aguardando' });
  }

  return NextResponse.json({ status: 'erro' });
}
