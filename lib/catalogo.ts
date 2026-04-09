import { db } from '@/lib/db';

export interface Produto {
  id: number;
  marca: string;
  sabor: string;
  descricao: string | null;
  tamanho: string;
  valor: number;
  estoque: number;
  emoji: string | null;
  novo: boolean;
}

export async function getProdutos(): Promise<Produto[]> {
  const { rows } = await db.query(
    `SELECT id, marca, sabor, descricao, tamanho, valor, estoque, emoji, novo
     FROM catalogo
     WHERE ativo = true
     ORDER BY marca, sabor`
  );
  return rows as Produto[];
}
