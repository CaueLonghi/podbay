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
  const { estoque, novo } = body;

  if (estoque !== undefined) {
    if (isNaN(Number(estoque))) return NextResponse.json({ error: 'estoque invalido' }, { status: 400 });
    await db.query('UPDATE catalogo SET estoque = $1 WHERE id = $2', [Number(estoque), id]);
  } else if (novo !== undefined) {
    await db.query('UPDATE catalogo SET novo = $1 WHERE id = $2', [Boolean(novo), id]);
  } else {
    return NextResponse.json({ error: 'campo invalido' }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: rawId } = await params;
  const id = Number(rawId);
  const body = await req.json();
  const { marca, sabor, descricao, tamanho, valor, custo, estoque, emoji } = body;

  if (!marca || !sabor || !tamanho || valor === undefined) {
    return NextResponse.json({ error: 'Campos obrigatorios: marca, sabor, tamanho, valor' }, { status: 400 });
  }

  await db.query(
    `UPDATE catalogo SET marca=$1, sabor=$2, descricao=$3, tamanho=$4, valor=$5, custo=$6, estoque=$7, emoji=$8 WHERE id=$9`,
    [marca, sabor, descricao || null, tamanho, Number(valor), Number(custo ?? 0), Number(estoque ?? 0), emoji || null, id]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: rawId } = await params;
  const id = Number(rawId);
  await db.query('UPDATE catalogo SET ativo = false WHERE id = $1', [id]);
  return NextResponse.json({ ok: true });
}
