import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

function periodoWhere(periodo: string): string {
  switch (periodo) {
    case 'hoje':
      return `p.criado_em >= CURRENT_DATE AND p.criado_em < CURRENT_DATE + INTERVAL '1 day'`;
    case '7dias':
      return `p.criado_em >= CURRENT_DATE - INTERVAL '6 days'`;
    case 'mes_atual':
      return `DATE_TRUNC('month', p.criado_em) = DATE_TRUNC('month', CURRENT_DATE)`;
    case 'mes_passado':
      return `DATE_TRUNC('month', p.criado_em) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')`;
    default:
      return '1=1';
  }
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const periodo = req.nextUrl.searchParams.get('periodo') ?? 'mes_atual';
  const where = periodoWhere(periodo);
  const statusFiltro = `p.status != 'cancelado'`;

  const { rows } = await db.query(`
    SELECT
      COUNT(DISTINCT p.id)                                                         AS total_vendas,
      COALESCE(SUM(p.valor_total), 0)                                              AS faturamento,
      COALESCE(SUM(p.valor_frete), 0)                                              AS total_frete,
      COALESCE(SUM((ip.valor_unitario - ip.custo_unitario)), 0)                    AS lucro
    FROM pedidos p
    JOIN itens_pedido ip ON ip.pedido_id = p.id
    WHERE ${statusFiltro} AND ${where}
  `);

  const resumo = rows[0];
  return NextResponse.json({
    total_vendas:  Number(resumo.total_vendas),
    faturamento:   Number(resumo.faturamento),
    total_frete:   Number(resumo.total_frete),
    lucro:         Number(resumo.lucro),
  });
}
