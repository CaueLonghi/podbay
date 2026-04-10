import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const {
    order_nsu,
    invoice_slug,
    transaction_nsu,
    receipt_url,
    amount,
    paid_amount,
  } = body as {
    order_nsu?: string;
    invoice_slug?: string;
    transaction_nsu?: string;
    receipt_url?: string;
    amount?: number;
    paid_amount?: number;
  };

  if (!order_nsu) {
    console.warn('[webhook] payload sem order_nsu', body);
    return NextResponse.json({ ok: true }); // retorna 200 para não reenviar
  }

  const pedidoId = Number(order_nsu);
  if (isNaN(pedidoId)) {
    console.warn('[webhook] order_nsu invalido', order_nsu);
    return NextResponse.json({ ok: true });
  }

  const pago = typeof paid_amount === 'number' && paid_amount > 0 &&
    (typeof amount !== 'number' || paid_amount >= amount);

  const novoStatus = pago ? 'pago' : 'pagamento_recusado';

  try {
    await db.query(
      `UPDATE pedidos
       SET status = $1,
           infinitepay_slug = $2,
           infinitepay_transaction_nsu = $3,
           receipt_url = $4
       WHERE id = $5`,
      [
        novoStatus,
        invoice_slug ?? null,
        transaction_nsu ?? null,
        receipt_url ?? null,
        pedidoId,
      ]
    );

    console.log(`[webhook] pedido ${pedidoId} → ${novoStatus}`);
  } catch (err) {
    console.error('[webhook] erro ao atualizar pedido', err);
    return new NextResponse('DB error', { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
