import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { rows: pedidos } = await db.query(`
    SELECT
      p.id,
      p.status,
      p.modalidade,
      p.horario_retirada,
      p.metodo_pagamento,
      p.valor_subtotal,
      p.desconto,
      p.valor_frete,
      p.valor_total,
      p.obs,
      p.criado_em,
      u.username,
      u.nome_completo,
      u.telefone,
      e.apelido        AS end_apelido,
      e.logradouro     AS end_logradouro,
      e.numero         AS end_numero,
      e.complemento    AS end_complemento,
      e.bairro         AS end_bairro,
      e.cidade         AS end_cidade,
      e.estado         AS end_estado,
      e.cep            AS end_cep
    FROM pedidos p
    JOIN usuarios u ON u.id = p.usuario_id
    LEFT JOIN enderecos e ON e.id = p.endereco_id
    ORDER BY p.criado_em DESC
  `);

  if (pedidos.length === 0) return NextResponse.json({ pedidos: [] });

  const ids = pedidos.map((p) => p.id);
  const { rows: itens } = await db.query(
    `SELECT pedido_id, nome_produto, sabor, tamanho, valor_unitario, custo_unitario, quantidade
     FROM itens_pedido WHERE pedido_id = ANY($1)`,
    [ids]
  );

  const itensPorPedido: Record<number, typeof itens> = {};
  for (const item of itens) {
    if (!itensPorPedido[item.pedido_id]) itensPorPedido[item.pedido_id] = [];
    itensPorPedido[item.pedido_id].push(item);
  }

  const resultado = pedidos.map((p) => ({
    ...p,
    itens: itensPorPedido[p.id] ?? [],
  }));

  return NextResponse.json({ pedidos: resultado });
}
