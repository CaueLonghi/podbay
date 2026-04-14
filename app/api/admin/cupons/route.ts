import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

  const { rows } = await db.query(
    `SELECT id, nome, codigo, valor, quantidade_total, quantidade_usada, ativo, criado_em
     FROM cupons ORDER BY criado_em DESC`
  );

  return NextResponse.json({ cupons: rows });
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

  const { nome, codigo, valor, quantidade_total } = await req.json();

  if (!nome || !codigo || !valor || !quantidade_total) {
    return NextResponse.json({ error: 'Campos obrigatorios: nome, codigo, valor, quantidade_total' }, { status: 400 });
  }

  const { rows: [cupom] } = await db.query(
    `INSERT INTO cupons (nome, codigo, valor, quantidade_total)
     VALUES ($1, UPPER($2), $3, $4) RETURNING id`,
    [nome, codigo, Number(valor), Number(quantidade_total)]
  );

  return NextResponse.json({ ok: true, id: cupom.id });
}
