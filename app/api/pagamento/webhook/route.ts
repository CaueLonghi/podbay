import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const HANDLE = process.env.INFINITEPAY_HANDLE ?? 'leonardoluc';

async function verificarPagamentoInfinitePay(
  order_nsu: string,
  transaction_nsu: string,
  slug: string
): Promise<{ paid: boolean; capture_method?: string; paid_amount?: number }> {
  try {
    const res = await fetch('https://api.infinitepay.io/invoices/public/checkout/payment_check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle: HANDLE, order_nsu, transaction_nsu, slug }),
    });
    if (!res.ok) {
      console.error('[webhook] payment_check status', res.status, await res.text());
      return { paid: false };
    }
    const data = await res.json();
    return {
      paid: data.paid === true && data.success === true,
      capture_method: data.capture_method,
      paid_amount: data.paid_amount,
    };
  } catch (err) {
    console.error('[webhook] erro ao verificar pagamento', err);
    return { paid: false };
  }
}

interface ItemSessao {
  produto_id: string;
  nome_produto: string;
  sabor: string;
  tamanho: string;
  valor_unitario: number;
  quantidade: number;
}

interface DadosSessao {
  usuario_id: number;
  modalidade: 'entrega' | 'retirada';
  endereco_id: number | null;
  horario_retirada: string | null;
  valor_subtotal: number;
  desconto: number;
  valor_frete: number;
  valor_total: number;
  cupom_codigo: string | null;
  obs: string | null;
  itens: ItemSessao[];
}

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
    capture_method,
  } = body as {
    order_nsu?: string;
    invoice_slug?: string;
    transaction_nsu?: string;
    receipt_url?: string;
    amount?: number;
    paid_amount?: number;
    capture_method?: string;
  };

  if (!order_nsu) {
    console.warn('[webhook] payload sem order_nsu', body);
    return NextResponse.json({ ok: true });
  }

  // Verifica autenticidade do pagamento diretamente na InfinitePay
  const verificacao = await verificarPagamentoInfinitePay(
    order_nsu,
    transaction_nsu ?? '',
    invoice_slug ?? ''
  );

  const pago = verificacao.paid;
  const captureMethod = verificacao.capture_method ?? capture_method;

  // Busca sessão de checkout (pedido PIX ainda não persistido)
  const { rows: [sessao] } = await db.query(
    'SELECT id, dados FROM checkout_sessions WHERE id = $1',
    [order_nsu]
  );

  if (sessao) {
    const dados = sessao.dados as DadosSessao;

    if (!pago) {
      // Pagamento recusado: descarta sessão e reverte cupom
      await db.query('DELETE FROM checkout_sessions WHERE id = $1', [order_nsu]);
      if (dados.cupom_codigo) {
        await db.query(
          'UPDATE cupons SET quantidade_usada = quantidade_usada - 1 WHERE UPPER(codigo) = UPPER($1)',
          [dados.cupom_codigo]
        );
      }
      console.log(`[webhook] checkout ${order_nsu} → pagamento recusado, sessão descartada`);
      return NextResponse.json({ ok: true });
    }

    // Pagamento confirmado: cria pedido com status 'pago'
    try {
      const { rows: [pedido] } = await db.query(
        `INSERT INTO pedidos
           (usuario_id, modalidade, metodo_pagamento, endereco_id, horario_retirada,
            valor_subtotal, desconto, valor_frete, valor_total, status,
            infinitepay_slug, infinitepay_transaction_nsu, receipt_url, checkout_nsu, obs)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pago',$10,$11,$12,$13,$14) RETURNING id`,
        [
          dados.usuario_id,
          dados.modalidade,
          captureMethod ?? 'pix',
          dados.endereco_id,
          dados.horario_retirada,
          dados.valor_subtotal,
          dados.desconto,
          dados.valor_frete,
          dados.valor_total,
          invoice_slug ?? null,
          transaction_nsu ?? null,
          receipt_url ?? null,
          order_nsu,
          dados.obs ?? null,
        ]
      );

      const pedidoId = pedido.id;

      // Busca custos e insere itens
      const produtoIds = dados.itens.map((i) => Number(i.produto_id)).filter(Boolean);
      const custoMap: Record<number, number> = {};
      if (produtoIds.length > 0) {
        const { rows: custoRows } = await db.query(
          'SELECT id, custo FROM catalogo WHERE id = ANY($1)',
          [produtoIds]
        );
        for (const row of custoRows) custoMap[row.id] = Number(row.custo ?? 0);
      }

      const rowValues = dados.itens.map((i) => {
        const pid = Number(i.produto_id) || null;
        return [pedidoId, pid, i.nome_produto, i.sabor, i.tamanho, i.valor_unitario, pid ? (custoMap[pid] ?? 0) : 0, i.quantidade];
      });
      const cols = 8;
      const placeholders = rowValues
        .map((_, i) => `(${Array.from({ length: cols }, (__, c) => `$${i * cols + c + 1}`).join(',')})`)
        .join(',');
      await db.query(
        `INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, sabor, tamanho, valor_unitario, custo_unitario, quantidade)
         VALUES ${placeholders}`,
        rowValues.flat()
      );

      await db.query('DELETE FROM checkout_sessions WHERE id = $1', [order_nsu]);
      console.log(`[webhook] checkout ${order_nsu} → pedido ${pedidoId} criado como pago`);
    } catch (err) {
      console.error('[webhook] erro ao criar pedido', err);
      return new NextResponse('DB error', { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  // Fallback: pedido já existe no banco (pedido dinheiro ou reprocessamento)
  const pedidoId = Number(order_nsu);
  if (!isNaN(pedidoId)) {
    const novoStatus = pago ? 'pago' : 'pagamento_recusado';
    try {
      await db.query(
        `UPDATE pedidos
         SET status = $1,
             infinitepay_slug = $2,
             infinitepay_transaction_nsu = $3,
             receipt_url = $4,
             metodo_pagamento = COALESCE($5, metodo_pagamento)
         WHERE id = $6`,
        [novoStatus, invoice_slug ?? null, transaction_nsu ?? null, receipt_url ?? null, captureMethod ?? null, pedidoId]
      );
      console.log(`[webhook] pedido ${pedidoId} → ${novoStatus}`);
    } catch (err) {
      console.error('[webhook] erro ao atualizar pedido', err);
      return new NextResponse('DB error', { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
