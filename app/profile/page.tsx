import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';
import ProfileClient from '@/components/ProfileClient';

interface UsuarioRow {
  id: number;
  username: string;
  nome_completo: string;
  email: string;
  telefone: string | null;
  is_admin: boolean;
  created_at: string;
}

export default async function ProfilePage() {
  const session = await getSessionUser();

  if (!session) {
    return <ProfileClient usuario={null} enderecos={[]} />;
  }

  const [{ rows: userRows }, { rows: enderecoRows }] = await Promise.all([
    db.query(
      'SELECT id, username, nome_completo, email, telefone, is_admin, created_at FROM usuarios WHERE id = $1 AND ativo = true LIMIT 1',
      [session.id]
    ),
    db.query(
      'SELECT id, apelido, cep, logradouro, numero, complemento, bairro, cidade, estado, principal FROM enderecos WHERE usuario_id = $1 ORDER BY principal DESC, id ASC',
      [session.id]
    ),
  ]);

  const usuario = userRows[0] as UsuarioRow;
  const enderecos = enderecoRows as any[];

  return <ProfileClient usuario={usuario} enderecos={enderecos} />;
}
