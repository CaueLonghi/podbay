import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';
import type mysql from 'mysql2/promise';

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT id, marca, sabor, descricao, tamanho, valor, custo, estoque, emoji, ativo
     FROM catalogo ORDER BY marca, tamanho, sabor`
  );
  return NextResponse.json({ produtos: rows });
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { marca, sabor, descricao, tamanho, valor, custo, estoque, emoji } = body;

  if (!marca || !sabor || !tamanho || !valor) {
    return NextResponse.json({ error: 'Campos obrigatorios: marca, sabor, tamanho, valor' }, { status: 400 });
  }

  const [result] = await db.query<mysql.ResultSetHeader>(
    `INSERT INTO catalogo (marca, sabor, descricao, tamanho, valor, custo, estoque, emoji, ativo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [marca, sabor, descricao || null, tamanho, Number(valor), Number(custo ?? 0), Number(estoque ?? 0), emoji || null]
  );

  return NextResponse.json({ id: result.insertId }, { status: 201 });
}
