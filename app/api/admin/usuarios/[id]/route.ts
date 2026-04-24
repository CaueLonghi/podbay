import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: rawId } = await params;
  const id = Number(rawId);

  const [{ rows: enderecos }, { rows: pedidos }] = await Promise.all([
    db.query(
      `SELECT id, apelido, logradouro, numero, complemento, bairro, cidade, estado, cep, principal
       FROM enderecos WHERE usuario_id = $1 ORDER BY principal DESC, id DESC`,
      [id]
    ),
    db.query(
      `SELECT p.id, p.modalidade, p.metodo_pagamento, p.status,
              p.valor_subtotal, p.desconto, p.valor_frete, p.valor_total,
              p.horario_retirada, p.obs, p.criado_em,
              COALESCE(
                json_agg(
                  json_build_object(
                    'nome_produto', i.nome_produto,
                    'sabor', i.sabor,
                    'tamanho', i.tamanho,
                    'quantidade', i.quantidade,
                    'valor_unitario', i.valor_unitario
                  ) ORDER BY i.id
                ) FILTER (WHERE i.id IS NOT NULL),
                '[]'
              ) AS itens
       FROM pedidos p
       LEFT JOIN itens_pedido i ON i.pedido_id = p.id
       WHERE p.usuario_id = $1
       GROUP BY p.id
       ORDER BY p.criado_em DESC`,
      [id]
    ),
  ]);

  return NextResponse.json({ enderecos, pedidos });
}
