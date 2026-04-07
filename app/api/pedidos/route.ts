import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';
import type mysql from 'mysql2/promise';

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
  const { itens, modalidade, metodo_pagamento, endereco_id, horario_retirada } = body as {
    itens: ItemPayload[];
    modalidade: 'entrega' | 'retirada';
    metodo_pagamento: 'dinheiro' | 'pix' | null;
    endereco_id: number | null;
    horario_retirada: string | null;
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
  const [pendentes] = await db.query<mysql.RowDataPacket[]>(
    "SELECT id FROM pedidos WHERE usuario_id = ? AND status = 'pendente' LIMIT 1",
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
    const [rows] = await db.query<mysql.RowDataPacket[]>(
      'SELECT id FROM enderecos WHERE id = ? AND usuario_id = ? LIMIT 1',
      [endereco_id, Number(user.id)]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Endereco invalido' }, { status: 400 });
    }
  }

  const valor_subtotal = itens.reduce((s, i) => s + i.valor_unitario * i.quantidade, 0);
  const valor_total = valor_subtotal;

  try {
    const [result] = await db.query<mysql.ResultSetHeader>(
      `INSERT INTO pedidos
         (usuario_id, modalidade, metodo_pagamento, endereco_id, horario_retirada,
          valor_subtotal, desconto, valor_frete, valor_total, status)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, 'pendente')`,
      [
        Number(user.id),
        modalidade,
        metodo_pagamento ?? null,
        endereco_id ?? null,
        horario_retirada ?? null,
        valor_subtotal,
        valor_total,
      ]
    );

    const pedidoId = result.insertId;

    const rowValues = itens.map((i) => [
      pedidoId,
      Number(i.produto_id) || null,
      i.nome_produto,
      i.sabor,
      i.tamanho,
      i.valor_unitario,
      i.quantidade,
    ]);

    await db.query(
      `INSERT INTO itens_pedido
         (pedido_id, produto_id, nome_produto, sabor, tamanho, valor_unitario, quantidade)
       VALUES ?`,
      [rowValues]
    );

    return NextResponse.json({ ok: true, pedido_id: pedidoId });
  } catch (err) {
    console.error('[POST /api/pedidos]', err);
    return NextResponse.json({ error: 'Erro interno ao salvar pedido' }, { status: 500 });
  }
}
