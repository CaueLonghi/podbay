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
  const body = await req.json();
  const { status } = body;

  const allowed = ['pendente', 'pago', 'enviado', 'entregue', 'cancelado'];
  if (!status || !allowed.includes(status)) {
    return NextResponse.json({ error: 'Status invalido' }, { status: 400 });
  }

  const fields = [`status = $1`];
  const values: (string | number)[] = [status];

  values.push(id);
  await db.query(`UPDATE pedidos SET ${fields.join(', ')} WHERE id = $2`, values);
  return NextResponse.json({ ok: true });
}
