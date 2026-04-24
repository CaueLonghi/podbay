import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { rows } = await db.query(
    `SELECT id, mes, ano, investimento, receita, lucro, criado_em
     FROM estimativas ORDER BY ano DESC, mes DESC`
  );
  return NextResponse.json({ estimativas: rows });
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { mes, ano, investimento, receita, lucro } = await req.json();

  if (!mes || !ano) return NextResponse.json({ error: 'mes e ano obrigatorios' }, { status: 400 });

  await db.query(
    `INSERT INTO estimativas (mes, ano, investimento, receita, lucro)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (mes, ano) DO UPDATE
       SET investimento = EXCLUDED.investimento,
           receita      = EXCLUDED.receita,
           lucro        = EXCLUDED.lucro,
           criado_em    = NOW()`,
    [Number(mes), Number(ano), Number(investimento), Number(receita), Number(lucro)]
  );

  return NextResponse.json({ ok: true });
}
