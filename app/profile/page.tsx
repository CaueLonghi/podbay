import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';
import type mysql from 'mysql2/promise';
import ProfileClient from '@/components/ProfileClient';

interface UsuarioRow {
  id: number;
  username: string;
  nome_completo: string;
  email: string;
  telefone: string | null;
  is_admin: number;
  created_at: string;
}

interface EnderecoRow {
  id: number;
  apelido: string | null;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  principal: number;
}

export default async function ProfilePage() {
  const session = await getSessionUser();

  if (!session) {
    return <ProfileClient usuario={null} enderecos={[]} />;
  }

  const [[userRows], [enderecoRows]] = await Promise.all([
    db.query<mysql.RowDataPacket[]>(
      'SELECT id, username, nome_completo, email, telefone, is_admin, created_at FROM usuarios WHERE id = ? AND ativo = 1 LIMIT 1',
      [session.id]
    ),
    db.query<mysql.RowDataPacket[]>(
      'SELECT id, apelido, cep, logradouro, numero, complemento, bairro, cidade, estado, principal FROM enderecos WHERE usuario_id = ? ORDER BY principal DESC, id ASC',
      [session.id]
    ),
  ]);

  const usuario = userRows[0] as UsuarioRow;
  const enderecos = enderecoRows as EnderecoRow[];

  return <ProfileClient usuario={usuario} enderecos={enderecos} />;
}
