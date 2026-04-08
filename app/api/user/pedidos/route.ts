import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });

  const { rows: pedidos } = await db.query(
    `SELECT p.id, p.status, p.modalidade, p.valor_total, p.criado_em,
            STRING_AGG(ip.quantidade::text || 'x ' || ip.nome_produto || ' ' || ip.tamanho, ', ' ORDER BY ip.id) AS resumo_itens
     FROM pedidos p
     JOIN itens_pedido ip ON ip.pedido_id = p.id
     WHERE p.usuario_id = $1
     GROUP BY p.id
     ORDER BY p.criado_em DESC`,
    [Number(user.id)]
  );

  return NextResponse.json({ pedidos });
}
