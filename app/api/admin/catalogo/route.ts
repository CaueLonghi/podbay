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
    `SELECT id, marca, sabor, descricao, tamanho, valor, custo, estoque, emoji, ativo, foto_url
     FROM catalogo ORDER BY marca, tamanho, sabor`
  );
  return NextResponse.json({ produtos: rows });
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { marca, sabor, descricao, tamanho, valor, custo, estoque, emoji, foto_url } = body;

  if (!marca || !sabor || !tamanho || !valor) {
    return NextResponse.json({ error: 'Campos obrigatorios: marca, sabor, tamanho, valor' }, { status: 400 });
  }

  const { rows: [result] } = await db.query(
    `INSERT INTO catalogo (marca, sabor, descricao, tamanho, valor, custo, estoque, emoji, foto_url, ativo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true) RETURNING id`,
    [marca, sabor, descricao || null, tamanho, Number(valor), Number(custo ?? 0), Number(estoque ?? 0), emoji || null, foto_url || null]
  );

  return NextResponse.json({ id: result.id }, { status: 201 });
}
