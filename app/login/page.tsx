'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erro ao fazer login');
        return;
      }

      router.push(from);
      router.refresh();
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: '#0f0f1e' }}
    >
      {/* Logo */}
      <div className="mb-10 text-center">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 text-4xl"
          style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}
        >
          💨
        </div>
        <h1 className="text-4xl font-bold" style={{ color: '#a78bfa' }}>
          PODBAY
        </h1>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
          Sua loja de vape favorita
        </p>
        <Link
          href="/"
          className="inline-block mt-3 text-xs font-medium px-4 py-1.5 rounded-full border transition-colors"
          style={{ color: '#a78bfa', borderColor: '#3d3d4d' }}
        >
          Ver catálogo
        </Link>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-3xl p-6 shadow-xl"
        style={{ background: '#1f1f2e', border: '1px solid #3d3d4d' }}
      >
        <h2 className="text-lg font-bold mb-6" style={{ color: '#e5e7eb' }}>
          Entrar na sua conta
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#9ca3af' }}>
              Usuário
            </label>
            <div className="relative">
              <User
                size={16}
                style={{
                  color: '#9ca3af',
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuário"
                required
                autoComplete="username"
                className="w-full rounded-xl pl-10 pr-4 py-3 text-sm border focus:outline-none focus:border-violet-400 transition-colors"
                style={{
                  background: '#0f0f1e',
                  color: '#e5e7eb',
                  borderColor: '#3d3d4d',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#9ca3af' }}>
              Senha
            </label>
            <div className="relative">
              <Lock
                size={16}
                style={{
                  color: '#9ca3af',
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
                autoComplete="current-password"
                className="w-full rounded-xl pl-10 pr-10 py-3 text-sm border focus:outline-none focus:border-violet-400 transition-colors"
                style={{
                  background: '#0f0f1e',
                  color: '#e5e7eb',
                  borderColor: '#3d3d4d',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#6b7280' }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p
              className="text-xs font-medium rounded-xl px-3 py-2"
              style={{ background: '#3b1a1a', color: '#f87171' }}
            >
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm border-none cursor-pointer transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          {/* Cadastrar-se */}
          <Link
            href="/register"
            className="block w-full py-3.5 rounded-2xl text-center font-bold text-sm transition-colors"
            style={{ background: '#0f0f1e', color: '#a78bfa', border: '1px solid #3d3d4d' }}
          >
            Cadastrar-se
          </Link>
        </form>
      </div>

      <p className="text-xs mt-6" style={{ color: '#3d3d4d' }}>
        PODBAY © {new Date().getFullYear()}
      </p>
    </div>
  );
}
