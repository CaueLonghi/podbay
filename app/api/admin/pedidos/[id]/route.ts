import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const id = Number(params.id);
  const body = await req.json();
  const { status, codigo_rastreio } = body;

  const allowed = ['pendente', 'pago', 'enviado', 'entregue', 'cancelado'];
  if (status && !allowed.includes(status)) {
    return NextResponse.json({ error: 'Status invalido' }, { status: 400 });
  }

  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (status) { fields.push('status = ?'); values.push(status); }
  if (codigo_rastreio !== undefined) { fields.push('codigo_rastreio = ?'); values.push(codigo_rastreio); }

  if (fields.length === 0) return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 });

  values.push(id);
  await db.query(`UPDATE pedidos SET ${fields.join(', ')} WHERE id = ?`, values);
  return NextResponse.json({ ok: true });
}
