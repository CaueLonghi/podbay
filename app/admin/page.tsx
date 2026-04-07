import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';
import type mysql from 'mysql2/promise';
import AdminClient from '@/components/AdminClient';

export default async function AdminPage() {
  const session = await getSessionUser();
  if (!session || session.role !== 'admin') redirect('/');

  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT id, marca, sabor, descricao, tamanho, valor, estoque, emoji, categoria, ativo
     FROM catalogo ORDER BY marca, tamanho, sabor`
  );

  return <AdminClient produtos={rows as any[]} />;
}
