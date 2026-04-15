import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';
import { criarLinkPagamento } from '@/lib/infinitepay';

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
  const { itens, modalidade, endereco_id, horario_retirada, valor_frete, cupom_codigo } = body as {
    itens: ItemPayload[];
    modalidade: 'entrega' | 'retirada';
    endereco_id: number | null;
    horario_retirada: string | null;
    valor_frete?: number;
    cupom_codigo?: string;
  };

  if (!itens || itens.length === 0)
    return NextResponse.json({ error: 'Nenhum item no pedido' }, { status: 400 });
  if (modalidade === 'entrega' && !endereco_id)
    return NextResponse.json({ error: 'Endereco obrigatorio para entrega' }, { status: 400 });

  // Valida endereco
  if (endereco_id) {
    const { rows } = await db.query(
      'SELECT id FROM enderecos WHERE id = $1 AND usuario_id = $2 LIMIT 1',
      [endereco_id, Number(user.id)]
    );
    if (rows.length === 0)
      return NextResponse.json({ error: 'Endereco invalido' }, { status: 400 });
  }

  // Valida e aplica cupom atomicamente
  let desconto = 0;
  let cupomUsado = false;
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
    if (cupomRows.length === 0)
      return NextResponse.json({ error: 'Cupom nao disponivel ou esgotado' }, { status: 409 });
    desconto = Number(cupomRows[0].valor);
    cupomUsado = true;
  }

  const valor_subtotal = itens.reduce((s, i) => s + i.valor_unitario * i.quantidade, 0);
  const frete = Number(valor_frete ?? 0);
  const valor_total = Math.max(0, valor_subtotal + frete - desconto);

  // Busca dados do usuario para InfinitePay
  const { rows: [usuario] } = await db.query(
    'SELECT nome_completo, telefone FROM usuarios WHERE id = $1',
    [Number(user.id)]
  );

  // Monta itens para InfinitePay
  const itemsIP = itens.map((i) => ({
    description: `${i.nome_produto} ${i.tamanho} - ${i.sabor}`,
    quantity: i.quantidade,
    price: Math.round(i.valor_unitario * 100),
  }));

  if (frete > 0)
    itemsIP.push({ description: 'Frete', quantity: 1, price: Math.round(frete * 100) });

  if (desconto > 0) {
    let remaining = Math.round(desconto * 100);
    for (let i = 0; i < itemsIP.length && remaining > 0; i++) {
      const maxReduction = (itemsIP[i].price - 1) * itemsIP[i].quantity;
      const reduction = Math.min(remaining, Math.max(0, maxReduction));
      itemsIP[i].price = Math.max(1, itemsIP[i].price - Math.floor(reduction / itemsIP[i].quantity));
      remaining -= reduction;
    }
  }

  // Gera ID único para a sessão de checkout
  const sessionId = `cs_${Date.now()}_${user.id}`;

  // Dados a serem persistidos no pedido após pagamento
  const dadosSessao = {
    usuario_id: Number(user.id),
    modalidade,
    endereco_id: endereco_id ?? null,
    horario_retirada: horario_retirada ?? null,
    valor_subtotal,
    desconto,
    valor_frete: frete,
    valor_total,
    cupom_codigo: cupomUsado ? cupom_codigo!.trim().toUpperCase() : null,
    itens,
  };

  try {
    // Salva sessão temporária
    await db.query(
      `INSERT INTO checkout_sessions (id, usuario_id, dados) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET dados = EXCLUDED.dados`,
      [sessionId, Number(user.id), JSON.stringify(dadosSessao)]
    );

    const { url } = await criarLinkPagamento({
      pedidoId: sessionId as unknown as number,
      itens: itemsIP,
      nomeCliente: usuario?.nome_completo ?? undefined,
      telefoneCliente: usuario?.telefone ?? undefined,
    });

    return NextResponse.json({ ok: true, url });
  } catch (err) {
    // Reverte cupom em caso de erro
    if (cupomUsado && cupom_codigo?.trim()) {
      await db.query(
        "UPDATE cupons SET quantidade_usada = quantidade_usada - 1 WHERE UPPER(codigo) = UPPER($1)",
        [cupom_codigo.trim()]
      );
    }
    await db.query('DELETE FROM checkout_sessions WHERE id = $1', [sessionId]);
    console.error('[pagamento/iniciar]', err);
    return NextResponse.json({ error: 'Erro ao gerar link de pagamento' }, { status: 502 });
  }
}
