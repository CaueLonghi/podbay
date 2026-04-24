import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

interface ItemPayload {
  produto_id: string;
  nome_produto: string;
  sabor: string;
  tamanho: string;
  valor_unitario: number;
  quantidade: number;
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });

  const body = await req.json();
  const { itens, modalidade, metodo_pagamento, endereco_id, horario_retirada, valor_frete, cupom_codigo, obs } = body as {
    itens: ItemPayload[];
    modalidade: 'entrega' | 'retirada';
    metodo_pagamento: 'dinheiro' | 'pix' | null;
    endereco_id: number | null;
    horario_retirada: string | null;
    valor_frete?: number;
    cupom_codigo?: string;
    obs?: string | null;
  };

  if (!itens || itens.length === 0) {
    return NextResponse.json({ error: 'Nenhum item no pedido' }, { status: 400 });
  }
  if (!modalidade) {
    return NextResponse.json({ error: 'Modalidade obrigatoria' }, { status: 400 });
  }
  if (modalidade === 'entrega' && !endereco_id) {
    return NextResponse.json({ error: 'Endereco obrigatorio para entrega' }, { status: 400 });
  }
  if (modalidade === 'retirada' && !horario_retirada) {
    return NextResponse.json({ error: 'Horario obrigatorio para retirada' }, { status: 400 });
  }

  // Bloqueia se ja existe um pedido pendente do usuario
  const { rows: pendentes } = await db.query(
    "SELECT id FROM pedidos WHERE usuario_id = $1 AND status = 'pendente' LIMIT 1",
    [Number(user.id)]
  );
  if (pendentes.length > 0) {
    return NextResponse.json(
      { error: 'Voce ja possui um pedido pendente. Aguarde a confirmacao antes de fazer um novo.' },
      { status: 409 }
    );
  }

  // Valida que o endereco_id pertence ao usuario logado
  if (endereco_id) {
    const { rows } = await db.query(
      'SELECT id FROM enderecos WHERE id = $1 AND usuario_id = $2 LIMIT 1',
      [endereco_id, Number(user.id)]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Endereco invalido' }, { status: 400 });
    }
  }

  // Valida e aplica cupom atomicamente
  let desconto = 0;
  if (cupom_codigo?.trim()) {
    const { rows: cupomRows } = await db.query(
      `UPDATE cupons
       SET quantidade_usada = quantidade_usada + 1
       WHERE UPPER(codigo) = UPPER($1)
         AND ativo = true
         AND quantidade_usada < quantidade_total
       RETURNING valor`,
      [cupom_codigo.trim()]
    );
    if (cupomRows.length === 0) {
      return NextResponse.json({ error: 'Cupom nao disponivel ou esgotado' }, { status: 409 });
    }
    desconto = Number(cupomRows[0].valor);
  }

  const valor_subtotal = itens.reduce((s, i) => s + i.valor_unitario * i.quantidade, 0);
  const frete = Number(valor_frete ?? 0);
  const valor_total = Math.max(0, valor_subtotal + frete - desconto);

  try {
    const { rows: [pedido] } = await db.query(
      `INSERT INTO pedidos
         (usuario_id, modalidade, metodo_pagamento, endereco_id, horario_retirada,
          valor_subtotal, desconto, valor_frete, valor_total, status, obs)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pendente', $10) RETURNING id`,
      [
        Number(user.id),
        modalidade,
        metodo_pagamento ?? null,
        endereco_id ?? null,
        horario_retirada ?? null,
        valor_subtotal,
        desconto,
        frete,
        valor_total,
        obs ?? null,
      ]
    );

    const pedidoId = pedido.id;

    // Busca custos dos produtos em uma única query
    const produtoIds = itens.map((i) => Number(i.produto_id)).filter(Boolean);
    const custoMap: Record<number, number> = {};
    if (produtoIds.length > 0) {
      const { rows: custoRows } = await db.query(
        'SELECT id, custo FROM catalogo WHERE id = ANY($1)',
        [produtoIds]
      );
      for (const row of custoRows) custoMap[row.id] = Number(row.custo ?? 0);
    }

    // Bulk insert de itens
    const rowValues = itens.map((i) => {
      const pid = Number(i.produto_id) || null;
      return [
        pedidoId,
        pid,
        i.nome_produto,
        i.sabor,
        i.tamanho,
        i.valor_unitario,
        pid ? (custoMap[pid] ?? 0) : 0,
        i.quantidade,
      ];
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

    // Reduz estoque de cada produto (mínimo 0)
    const itensComProduto = itens.filter((i) => Number(i.produto_id));
    if (itensComProduto.length > 0) {
      await Promise.all(
        itensComProduto.map((i) =>
          db.query(
            'UPDATE catalogo SET estoque = GREATEST(0, estoque - $1) WHERE id = $2',
            [i.quantidade, Number(i.produto_id)]
          )
        )
      );
    }

    return NextResponse.json({ ok: true, pedido_id: pedidoId });
  } catch (err) {
    console.error('[POST /api/pedidos]', err);
    return NextResponse.json({ error: 'Erro interno ao salvar pedido' }, { status: 500 });
  }
}
