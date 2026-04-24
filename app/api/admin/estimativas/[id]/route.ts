import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: rawId } = await params;
  const id = Number(rawId);
  const { mes, ano, investimento, receita, lucro } = await req.json();

  await db.query(
    `UPDATE estimativas SET mes=$1, ano=$2, investimento=$3, receita=$4, lucro=$5 WHERE id=$6`,
    [Number(mes), Number(ano), Number(investimento), Number(receita), Number(lucro), id]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: rawId } = await params;
  await db.query('DELETE FROM estimativas WHERE id = $1', [Number(rawId)]);
  return NextResponse.json({ ok: true });
}
