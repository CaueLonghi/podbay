import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

async function requireAdmin() {
  const user = await getSessionUser();
  return user?.role === 'admin' ? user : null;
}

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string; parcelaId: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id, parcelaId } = await params;
  const { rows: [parcela] } = await db.query(
    `SELECT pago FROM agiotagem_parcelas WHERE id = $1 AND agiotagem_id = $2`,
    [Number(parcelaId), Number(id)]
  );
  if (!parcela) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  const novoPago = !parcela.pago;
  await db.query(
    `UPDATE agiotagem_parcelas SET pago = $1, data_pagamento = $2 WHERE id = $3`,
    [novoPago, novoPago ? new Date().toISOString().slice(0, 10) : null, Number(parcelaId)]
  );
  return NextResponse.json({ ok: true, pago: novoPago });
}
