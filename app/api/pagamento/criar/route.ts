import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';
import { criarLinkPagamento } from '@/lib/infinitepay';

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });

  const { pedido_id } = await req.json();
  if (!pedido_id) return NextResponse.json({ error: 'pedido_id obrigatorio' }, { status: 400 });

  // Verifica que o pedido pertence ao usuário
  const { rows: [pedido] } = await db.query(
    `SELECT p.id, p.valor_total, p.valor_frete, p.desconto, u.nome_completo, u.telefone
     FROM pedidos p
     JOIN usuarios u ON u.id = p.usuario_id
     WHERE p.id = $1 AND p.usuario_id = $2 AND p.status = 'pendente'`,
    [Number(pedido_id), Number(user.id)]
  );

  if (!pedido) return NextResponse.json({ error: 'Pedido nao encontrado' }, { status: 404 });

  // Busca itens do pedido
  const { rows: itens } = await db.query(
    `SELECT nome_produto, sabor, tamanho, valor_unitario, quantidade
     FROM itens_pedido WHERE pedido_id = $1`,
    [Number(pedido_id)]
  );

  const itemsIP = itens.map((i) => ({
    description: `${i.nome_produto} ${i.tamanho} - ${i.sabor}`,
    quantity: Number(i.quantidade),
    price: Math.round(Number(i.valor_unitario) * 100), // centavos
  }));

  // Adiciona frete como item se houver
  const valorFrete = Number(pedido.valor_frete ?? 0);
  if (valorFrete > 0) {
    itemsIP.push({ description: 'Frete Uber Moto', quantity: 1, price: Math.round(valorFrete * 100) });
  }

  // Aplica desconto reduzindo o preço dos itens (InfinitePay não aceita preço negativo)
  const desconto = Number(pedido.desconto ?? 0);
  if (desconto > 0) {
    let remaining = Math.round(desconto * 100);
    for (let i = 0; i < itemsIP.length && remaining > 0; i++) {
      const maxReduction = (itemsIP[i].price - 1) * itemsIP[i].quantity;
      const reduction = Math.min(remaining, Math.max(0, maxReduction));
      itemsIP[i].price = Math.max(1, itemsIP[i].price - Math.floor(reduction / itemsIP[i].quantity));
      remaining -= reduction;
    }
  }

  try {
    const { url } = await criarLinkPagamento({
      pedidoId: Number(pedido_id),
      itens: itemsIP,
      nomeCliente: pedido.nome_completo ?? undefined,
      telefoneCliente: pedido.telefone ?? undefined,
    });

    return NextResponse.json({ ok: true, url });
  } catch (err) {
    console.error('[pagamento/criar]', err);
    return NextResponse.json({ error: 'Erro ao gerar link de pagamento' }, { status: 502 });
  }
}
