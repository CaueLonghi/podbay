'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: AuthUser | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  logout: async () => {},
});

export function AuthProvider({ children, initialUser }: { children: ReactNode; initialUser: AuthUser | null }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(initialUser);

  useEffect(() => {
    const newId = initialUser?.id ?? null;
    const curId = user?.id ?? null;
    if (newId !== curId) setUser(initialUser);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUser]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
    router.refresh();
  }

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
