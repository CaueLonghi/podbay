import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { SESSION_COOKIE } from '@/lib/auth-config';
import type mysql from 'mysql2/promise';
import type { AuthUser } from '@/lib/auth';

interface UsuarioRow {
  id: number;
  username: string;
  is_admin: number;
}

/**
 * Lê o ID do usuário a partir do cookie de sessão e busca no banco.
 * Retorna null se não autenticado ou usuário inativo/inexistente.
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const [rows] = await db.query<mysql.RowDataPacket[]>(
    'SELECT id, username, is_admin FROM usuarios WHERE id = ? AND ativo = 1 LIMIT 1',
    [sessionId]
  );

  const user = rows[0] as UsuarioRow | undefined;
  if (!user) return null;

  return {
    id:       String(user.id),
    username: user.username,
    role:     user.is_admin === 1 ? 'admin' : 'user',
  };
}
