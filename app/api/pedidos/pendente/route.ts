import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ pendente: false });

  const { rows } = await db.query(
    "SELECT id FROM pedidos WHERE usuario_id = $1 AND status = 'pendente' LIMIT 1",
    [Number(user.id)]
  );

  return NextResponse.json({ pendente: rows.length > 0 });
}
