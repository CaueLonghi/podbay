import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { SESSION_COOKIE } from '@/lib/auth-config';
import type { AuthUser } from '@/lib/auth';

export async function getSessionUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const { rows } = await db.query(
    'SELECT id, username, is_admin FROM usuarios WHERE id = $1 AND ativo = true LIMIT 1',
    [sessionId]
  );

  const user = rows[0];
  if (!user) return null;

  return {
    id:       String(user.id),
    username: user.username,
    role:     user.is_admin ? 'admin' : 'user',
  };
}
