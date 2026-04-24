import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { rows: usuarios } = await db.query(
    `SELECT id, username, nome_completo, email, telefone, is_admin, created_at
     FROM usuarios
     WHERE ativo = true
     ORDER BY created_at DESC`
  );

  return NextResponse.json({ usuarios });
}
