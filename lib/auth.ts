import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'user';
}

export async function validateCredentials(
  username: string,
  password: string
): Promise<AuthUser | null> {
  const { rows } = await db.query(
    'SELECT id, username, password_hash, is_admin FROM usuarios WHERE (username = $1 OR email = $1) AND ativo = true LIMIT 1',
    [username]
  );

  const user = rows[0];
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return null;

  return {
    id:       String(user.id),
    username: user.username,
    role:     user.is_admin ? 'admin' : 'user',
  };
}

export { SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth-config';
