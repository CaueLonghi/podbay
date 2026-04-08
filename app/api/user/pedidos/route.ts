import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';
import type mysql from 'mysql2/promise';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });

  const [pedidos] = await db.query<mysql.RowDataPacket[]>(
    `SELECT p.id, p.status, p.modalidade, p.valor_total, p.criado_em,
            GROUP_CONCAT(CONCAT(ip.quantidade, 'x ', ip.nome_produto, ' ', ip.tamanho) ORDER BY ip.id SEPARATOR ', ') AS resumo_itens
     FROM pedidos p
     JOIN itens_pedido ip ON ip.pedido_id = p.id
     WHERE p.usuario_id = ?
     GROUP BY p.id
     ORDER BY p.criado_em DESC`,
    [Number(user.id)]
  );

  return NextResponse.json({ pedidos });
}
