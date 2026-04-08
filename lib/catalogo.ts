import { db } from '@/lib/db';
import type mysql from 'mysql2/promise';

export interface Produto {
  id: number;
  marca: string;
  sabor: string;
  descricao: string | null;
  tamanho: string;
  valor: number;
  estoque: number;
  emoji: string | null;
}

export async function getProdutos(): Promise<Produto[]> {
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT id, marca, sabor, descricao, tamanho, valor, estoque, emoji
     FROM catalogo
     WHERE ativo = 1
     ORDER BY marca, sabor`
  );
  return rows as Produto[];
}
