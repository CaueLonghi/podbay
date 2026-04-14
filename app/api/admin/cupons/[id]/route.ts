import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || !user.admin) return null;
  return user;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

  const id = Number(params.id);
  const body = await req.json();

  const allowed = ['ativo', 'nome', 'valor', 'quantidade_total'];
  const fields = Object.keys(body).filter((k) => allowed.includes(k));
  if (fields.length === 0) return NextResponse.json({ error: 'Nenhum campo valido' }, { status: 400 });

  const sets = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  const values = fields.map((f) => body[f]);

  await db.query(`UPDATE cupons SET ${sets} WHERE id = $1`, [id, ...values]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

  await db.query('DELETE FROM cupons WHERE id = $1', [Number(params.id)]);
  return NextResponse.json({ ok: true });
}
