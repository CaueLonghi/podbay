import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'user';
}

interface UsuarioRow {
  id: number;
  username: string;
  password_hash: string;
  is_admin: number;
}

/**
 * Valida credenciais contra a tabela `usuarios` do MySQL.
 * Retorna o usuário autenticado ou null se inválido/inativo.
 */
export async function validateCredentials(
  username: string,
  password: string
): Promise<AuthUser | null> {
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    'SELECT id, username, password_hash, is_admin FROM usuarios WHERE (username = ? OR email = ?) AND ativo = 1 LIMIT 1',
    [username, username]
  );

  const user = rows[0] as UsuarioRow | undefined;
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return null;

  return {
    id:       String(user.id),
    username: user.username,
    role:     user.is_admin === 1 ? 'admin' : 'user',
  };
}

export { SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth-config';

// mysql RowDataPacket type import for casting
import type mysql from 'mysql2/promise';
