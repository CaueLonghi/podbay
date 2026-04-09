import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

async function requireAdmin() {
  const user = await getSessionUser();
  return user?.role === 'admin' ? user : null;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { rows: dividas } = await db.query(
    `SELECT id, nome, valor_emprestado, valor_total, num_parcelas, criado_em FROM agiotagem ORDER BY criado_em DESC`
  );
  if (dividas.length === 0) return NextResponse.json({ dividas: [] });

  const ids = dividas.map((d) => d.id);
  const { rows: parcelas } = await db.query(
    `SELECT id, agiotagem_id, numero, valor, pago, data_pagamento
     FROM agiotagem_parcelas WHERE agiotagem_id = ANY($1) ORDER BY agiotagem_id, numero`,
    [ids]
  );

  const parcelasPorDivida: Record<number, typeof parcelas> = {};
  for (const p of parcelas) {
    if (!parcelasPorDivida[p.agiotagem_id]) parcelasPorDivida[p.agiotagem_id] = [];
    parcelasPorDivida[p.agiotagem_id].push(p);
  }

  return NextResponse.json({
    dividas: dividas.map((d) => ({ ...d, parcelas: parcelasPorDivida[d.id] ?? [] })),
  });
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { nome, valor_emprestado, valor_total, num_parcelas } = await req.json();
  if (!nome || !valor_emprestado || !valor_total || !num_parcelas)
    return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });

  const emprestado = Number(valor_emprestado);
  const total = Number(valor_total);
  const parcelas = Number(num_parcelas);
  const valorParcela = Number((total / parcelas).toFixed(2));

  const { rows: [divida] } = await db.query(
    `INSERT INTO agiotagem (nome, valor_emprestado, valor_total, num_parcelas) VALUES ($1, $2, $3, $4) RETURNING id`,
    [nome, emprestado, total, parcelas]
  );

  const parcelaValues: unknown[] = [];
  const placeholders = Array.from({ length: parcelas }, (_, i) => {
    const base = i * 4;
    parcelaValues.push(divida.id, i + 1, valorParcela, false);
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
  }).join(',');

  await db.query(
    `INSERT INTO agiotagem_parcelas (agiotagem_id, numero, valor, pago) VALUES ${placeholders}`,
    parcelaValues
  );

  return NextResponse.json({ ok: true, id: divida.id }, { status: 201 });
}
