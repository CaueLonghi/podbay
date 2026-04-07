'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, User, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();

  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome_completo: nomeCompleto, email, telefone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao criar conta');
        return;
      }

      router.push('/');
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
      <div className="mb-8 text-center">
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
          Crie sua conta e comece a vaporar
        </p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-3xl p-6 shadow-xl"
        style={{ background: '#1f1f2e', border: '1px solid #3d3d4d' }}
      >
        <h2 className="text-lg font-bold mb-6" style={{ color: '#e5e7eb' }}>
          Criar conta
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome completo */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#9ca3af' }}>
              Nome completo
            </label>
            <div className="relative">
              <User
                size={16}
                style={{ color: '#9ca3af', position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                placeholder="Seu nome completo"
                required
                autoComplete="name"
                className="w-full rounded-xl pl-10 pr-4 py-3 text-sm border focus:outline-none focus:border-violet-400 transition-colors"
                style={{ background: '#0f0f1e', color: '#e5e7eb', borderColor: '#3d3d4d' }}
              />
            </div>
          </div>

          {/* E-mail */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#9ca3af' }}>
              E-mail
            </label>
            <div className="relative">
              <Mail
                size={16}
                style={{ color: '#9ca3af', position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
                className="w-full rounded-xl pl-10 pr-4 py-3 text-sm border focus:outline-none focus:border-violet-400 transition-colors"
                style={{ background: '#0f0f1e', color: '#e5e7eb', borderColor: '#3d3d4d' }}
              />
            </div>
          </div>

          {/* Telefone */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#9ca3af' }}>
              Telefone
            </label>
            <div className="relative">
              <Phone
                size={16}
                style={{ color: '#9ca3af', position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                required
                autoComplete="tel"
                className="w-full rounded-xl pl-10 pr-4 py-3 text-sm border focus:outline-none focus:border-violet-400 transition-colors"
                style={{ background: '#0f0f1e', color: '#e5e7eb', borderColor: '#3d3d4d' }}
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#9ca3af' }}>
              Senha
            </label>
            <div className="relative">
              <Lock
                size={16}
                style={{ color: '#9ca3af', position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-xl pl-10 pr-10 py-3 text-sm border focus:outline-none focus:border-violet-400 transition-colors"
                style={{ background: '#0f0f1e', color: '#e5e7eb', borderColor: '#3d3d4d' }}
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
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>

          {/* Link para login */}
          <p className="text-center text-xs" style={{ color: '#6b7280' }}>
            Já tem conta?{' '}
            <Link href="/login" className="font-semibold" style={{ color: '#a78bfa' }}>
              Entrar
            </Link>
          </p>
        </form>
      </div>

      <p className="text-xs mt-6" style={{ color: '#3d3d4d' }}>
        PODBAY © {new Date().getFullYear()}
      </p>
    </div>
  );
}
