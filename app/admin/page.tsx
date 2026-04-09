import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';
import AdminClient from '@/components/AdminClient';

export default async function AdminPage() {
  const session = await getSessionUser();
  if (!session || session.role !== 'admin') redirect('/');

  const { rows } = await db.query(
    `SELECT id, marca, sabor, descricao, tamanho, valor, custo, estoque, emoji, ativo
     FROM catalogo ORDER BY marca, tamanho, sabor`
  );

  return <AdminClient produtos={rows as any[]} />;
}
