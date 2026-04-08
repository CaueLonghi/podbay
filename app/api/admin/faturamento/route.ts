import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';
import type mysql from 'mysql2/promise';

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

function periodoWhere(periodo: string): string {
  switch (periodo) {
    case 'hoje':
      return `DATE(p.criado_em) = CURDATE()`;
    case '7dias':
      return `p.criado_em >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)`;
    case 'mes_atual':
      return `YEAR(p.criado_em) = YEAR(CURDATE()) AND MONTH(p.criado_em) = MONTH(CURDATE())`;
    case 'mes_passado':
      return `YEAR(p.criado_em) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
          AND MONTH(p.criado_em) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))`;
    default:
      return '1=1';
  }
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const periodo = req.nextUrl.searchParams.get('periodo') ?? 'mes_atual';
  const where = periodoWhere(periodo);
  const statusFiltro = `p.status NOT IN ('cancelado', 'pendente')`;

  const [[resumo]] = await db.query<mysql.RowDataPacket[]>(`
    SELECT
      COUNT(DISTINCT p.id)                                                         AS total_vendas,
      COALESCE(SUM(p.valor_total), 0)                                              AS faturamento,
      COALESCE(SUM(p.valor_frete), 0)                                              AS total_frete,
      COALESCE(SUM((ip.valor_unitario - ip.custo_unitario)), 0)    AS lucro
    FROM pedidos p
    JOIN itens_pedido ip ON ip.pedido_id = p.id
    WHERE ${statusFiltro} AND ${where}
  `);

  return NextResponse.json({
    total_vendas:  Number(resumo.total_vendas),
    faturamento:   Number(resumo.faturamento),
    total_frete:   Number(resumo.total_frete),
    lucro:         Number(resumo.lucro),
  });
}
