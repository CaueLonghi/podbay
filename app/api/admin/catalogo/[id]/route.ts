import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const id = Number(params.id);
  const body = await req.json();
  const { estoque } = body;

  if (estoque === undefined || isNaN(Number(estoque))) {
    return NextResponse.json({ error: 'estoque invalido' }, { status: 400 });
  }

  await db.query('UPDATE catalogo SET estoque = ? WHERE id = ?', [Number(estoque), id]);
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const id = Number(params.id);
  const body = await req.json();
  const { marca, sabor, descricao, tamanho, valor, estoque, emoji, categoria } = body;

  if (!marca || !sabor || !tamanho || valor === undefined) {
    return NextResponse.json({ error: 'Campos obrigatorios: marca, sabor, tamanho, valor' }, { status: 400 });
  }

  await db.query(
    `UPDATE catalogo SET marca=?, sabor=?, descricao=?, tamanho=?, valor=?, estoque=?, emoji=?, categoria=? WHERE id=?`,
    [marca, sabor, descricao || null, tamanho, Number(valor), Number(estoque ?? 0), emoji || null, categoria || 'pods', id]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const id = Number(params.id);
  await db.query('UPDATE catalogo SET ativo = 0 WHERE id = ?', [id]);
  return NextResponse.json({ ok: true });
}
