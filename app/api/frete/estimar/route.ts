import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';
import { geocodeEndereco } from '@/lib/geocoding';
import { estimarFreteUberMoto } from '@/lib/uber';

const FRETE_HABILITADO = false;

const LOJA_LAT = Number(process.env.LOJA_LATITUDE ?? '-23.708523');
const LOJA_LNG = Number(process.env.LOJA_LONGITUDE ?? '-46.686356');

// Cache em memória por endereco_id para não chamar APIs repetidamente
const freteCache = new Map<number, { valor: number; produto: string; distancia: number; ts: number }>();
const CACHE_TTL = 1000 * 60 * 15; // 15 minutos

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
  if (!FRETE_HABILITADO) return NextResponse.json({ frete: 0, produto: 'Frete', distancia: 0 });

  const enderecoId = Number(req.nextUrl.searchParams.get('endereco_id'));
  if (!enderecoId || isNaN(enderecoId)) {
    return NextResponse.json({ error: 'endereco_id obrigatorio' }, { status: 400 });
  }

  // Verifica cache
  const cached = freteCache.get(enderecoId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ frete: cached.valor, produto: cached.produto, distancia: cached.distancia });
  }

  // Busca endereço no banco (valida que pertence ao usuário)
  const { rows: [endereco] } = await db.query(
    `SELECT logradouro, numero, cidade, estado FROM enderecos WHERE id = $1 AND usuario_id = $2`,
    [enderecoId, Number(user.id)]
  );

  if (!endereco) return NextResponse.json({ error: 'Endereco nao encontrado' }, { status: 404 });

  try {
    const { lat, lng } = await geocodeEndereco(
      endereco.logradouro,
      endereco.numero,
      endereco.cidade,
      endereco.estado
    );

    const { valor, produto, distancia } = await estimarFreteUberMoto(LOJA_LAT, LOJA_LNG, lat, lng);

    freteCache.set(enderecoId, { valor, produto, distancia, ts: Date.now() });

    return NextResponse.json({ frete: valor, produto, distancia });
  } catch (err) {
    console.error('[frete/estimar]', err);
    // Retorna frete 0 em caso de erro para não bloquear o checkout
    return NextResponse.json({ frete: 0, produto: 'Frete', distancia: 0 });
  }
}
