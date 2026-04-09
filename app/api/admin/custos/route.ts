import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

async function requireAdmin() {
  const user = await getSessionUser();
  return user?.role === 'admin' ? user : null;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { rows } = await db.query(
    `SELECT id, descricao, valor, mes, ano FROM custos_mensais ORDER BY ano DESC, mes DESC, id DESC`
  );
  return NextResponse.json({ custos: rows });
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { descricao, valor, mes, ano } = await req.json();
  if (!descricao || !valor || !mes || !ano)
    return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
  const { rows: [row] } = await db.query(
    `INSERT INTO custos_mensais (descricao, valor, mes, ano) VALUES ($1, $2, $3, $4) RETURNING id`,
    [descricao, Number(valor), Number(mes), Number(ano)]
  );
  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
}
