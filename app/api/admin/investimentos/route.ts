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
    `SELECT id, descricao, valor, data FROM investimentos ORDER BY data DESC`
  );
  return NextResponse.json({ investimentos: rows });
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { descricao, valor, data } = await req.json();
  if (!valor || !data) return NextResponse.json({ error: 'Valor e data obrigatórios' }, { status: 400 });
  const { rows: [row] } = await db.query(
    `INSERT INTO investimentos (descricao, valor, data) VALUES ($1, $2, $3) RETURNING id`,
    [descricao || null, Number(valor), data]
  );
  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
}
