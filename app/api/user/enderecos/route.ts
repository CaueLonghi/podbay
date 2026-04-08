import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { rows } = await db.query(
    'SELECT id, apelido, cep, logradouro, numero, complemento, bairro, cidade, estado, principal FROM enderecos WHERE usuario_id = $1 ORDER BY principal DESC, id ASC',
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
  const { rows: countRows } = await db.query(
    'SELECT COUNT(*) AS total FROM enderecos WHERE usuario_id = $1',
    [user.id]
  );
  const isFirst = Number(countRows[0].total) === 0;

  const { rows: [result] } = await db.query(
    'INSERT INTO enderecos (usuario_id, apelido, cep, logradouro, numero, complemento, bairro, cidade, estado, principal) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
    [user.id, apelido || null, cep, logradouro, numero, complemento || null, bairro, cidade, estado, isFirst]
  );

  return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
}
