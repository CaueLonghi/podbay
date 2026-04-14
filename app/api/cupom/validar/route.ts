import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });

  const codigo = req.nextUrl.searchParams.get('codigo')?.trim();
  if (!codigo) return NextResponse.json({ valido: false, mensagem: 'Codigo obrigatorio' });

  const { rows: [cupom] } = await db.query(
    `SELECT nome, valor, ativo, quantidade_usada, quantidade_total
     FROM cupons WHERE codigo = UPPER($1)`,
    [codigo]
  );

  if (!cupom) {
    return NextResponse.json({ valido: false, mensagem: 'Cupom invalido' });
  }
  if (!cupom.ativo) {
    return NextResponse.json({ valido: false, mensagem: 'Cupom inativo' });
  }
  if (Number(cupom.quantidade_usada) >= Number(cupom.quantidade_total)) {
    return NextResponse.json({ valido: false, mensagem: 'Cupom esgotado' });
  }

  return NextResponse.json({
    valido: true,
    valor: Number(cupom.valor),
    nome: cupom.nome,
  });
}
