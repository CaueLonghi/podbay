import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';
import type mysql from 'mysql2/promise';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const [rows] = await db.query<mysql.RowDataPacket[]>(
    'SELECT id, apelido, cep, logradouro, numero, complemento, bairro, cidade, estado, principal FROM enderecos WHERE usuario_id = ? ORDER BY principal DESC, id ASC',
    [user.id]
  );

  return NextResponse.json({ enderecos: rows });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { apelido, cep, logradouro, numero, complemento, bairro, cidade, estado } = await req.json();

  if (!cep || !logradouro || !numero || !bairro || !cidade || !estado) {
    return NextResponse.json({ error: 'Preencha todos os campos obrigatórios' }, { status: 400 });
  }

  // Se for o primeiro endereço, define como principal
  const [countRows] = await db.query<mysql.RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM enderecos WHERE usuario_id = ?',
    [user.id]
  );
  const isFirst = (countRows[0] as { total: number }).total === 0;

  const [result] = await db.query<mysql.ResultSetHeader>(
    'INSERT INTO enderecos (usuario_id, apelido, cep, logradouro, numero, complemento, bairro, cidade, estado, principal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [user.id, apelido || null, cep, logradouro, numero, complemento || null, bairro, cidade, estado, isFirst ? 1 : 0]
  );

  return NextResponse.json({ ok: true, id: result.insertId }, { status: 201 });
}
