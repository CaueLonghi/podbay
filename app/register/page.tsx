'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, User, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { validarNome, validarEmail, validarTelefone, mascaraTelefone } from '@/lib/validacoes';

interface FieldErrors {
  nome?: string;
  email?: string;
  telefone?: string;
  senha?: string;
}

export default function RegisterPage() {
  const router = useRouter();

  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail]               = useState('');
  const [telefone, setTelefone]         = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading]         = useState(false);

  function validateAll(): FieldErrors {
    return {
      nome:     validarNome(nomeCompleto)  ?? undefined,
      email:    validarEmail(email)        ?? undefined,
      telefone: validarTelefone(telefone)  ?? undefined,
      senha:    password.length < 6 ? 'Senha deve ter pelo menos 6 caracteres' : undefined,
    };
  }

  function blurValidate(field: keyof FieldErrors) {
    const errs = validateAll();
    setFieldErrors((prev) => ({ ...prev, [field]: errs[field] }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError('');

    const errs = validateAll();
    if (Object.values(errs).some(Boolean)) {
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome_completo: nomeCompleto, email, telefone, password }),
      });

      const data = await res.json();
      if (!res.ok) { setServerError(data.error || 'Erro ao criar conta'); return; }

      router.push('/');
      router.refresh();
    } catch {
      setServerError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const inputBase = 'w-full rounded-xl pl-10 pr-4 py-3 text-sm border focus:outline-none transition-colors';
  const inputStyle = (err?: string) => ({
    background: '#0f0f1e',
    color: '#e5e7eb',
    borderColor: err ? '#f87171' : '#3d3d4d',
  });
  const iconStyle = { color: '#9ca3af', position: 'absolute' as const, left: 12, top: '50%', transform: 'translateY(-50%)' };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#0f0f1e' }}>
      <div className="mb-8 text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 text-4xl"
          style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}>
          💨
        </div>
        <h1 className="text-4xl font-bold" style={{ color: '#a78bfa' }}>PODBAY</h1>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Crie sua conta e comece a vaporar</p>
      </div>

      <div className="w-full max-w-sm rounded-3xl p-6 shadow-xl" style={{ background: '#1f1f2e', border: '1px solid #3d3d4d' }}>
        <h2 className="text-lg font-bold mb-6" style={{ color: '#e5e7eb' }}>Criar conta</h2>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {/* Nome completo */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#9ca3af' }}>Nome completo</label>
            <div className="relative">
              <User size={16} style={iconStyle} />
              <input
                type="text"
                value={nomeCompleto}
                onChange={(e) => { setNomeCompleto(e.target.value); setFieldErrors((p) => ({ ...p, nome: undefined })); }}
                onBlur={() => blurValidate('nome')}
                placeholder="Seu nome completo"
                autoComplete="name"
                className={`${inputBase} ${fieldErrors.nome ? 'focus:border-red-400' : 'focus:border-violet-400'}`}
                style={inputStyle(fieldErrors.nome)}
              />
            </div>
            {fieldErrors.nome && <p className="text-xs text-red-400 mt-1 pl-1">{fieldErrors.nome}</p>}
          </div>

          {/* E-mail */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#9ca3af' }}>E-mail</label>
            <div className="relative">
              <Mail size={16} style={iconStyle} />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })); }}
                onBlur={() => blurValidate('email')}
                placeholder="seu@email.com"
                autoComplete="email"
                className={`${inputBase} ${fieldErrors.email ? 'focus:border-red-400' : 'focus:border-violet-400'}`}
                style={inputStyle(fieldErrors.email)}
              />
            </div>
            {fieldErrors.email && <p className="text-xs text-red-400 mt-1 pl-1">{fieldErrors.email}</p>}
          </div>

          {/* Telefone */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#9ca3af' }}>Telefone</label>
            <div className="relative">
              <Phone size={16} style={iconStyle} />
              <input
                type="tel"
                value={telefone}
                onChange={(e) => { setTelefone(mascaraTelefone(e.target.value)); setFieldErrors((p) => ({ ...p, telefone: undefined })); }}
                onBlur={() => blurValidate('telefone')}
                placeholder="(11) 99999-9999"
                autoComplete="tel"
                className={`${inputBase} ${fieldErrors.telefone ? 'focus:border-red-400' : 'focus:border-violet-400'}`}
                style={inputStyle(fieldErrors.telefone)}
              />
            </div>
            {fieldErrors.telefone && <p className="text-xs text-red-400 mt-1 pl-1">{fieldErrors.telefone}</p>}
          </div>

          {/* Senha */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#9ca3af' }}>Senha</label>
            <div className="relative">
              <Lock size={16} style={iconStyle} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, senha: undefined })); }}
                onBlur={() => blurValidate('senha')}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                className={`${inputBase} pr-10 ${fieldErrors.senha ? 'focus:border-red-400' : 'focus:border-violet-400'}`}
                style={inputStyle(fieldErrors.senha)}
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
            {fieldErrors.senha && <p className="text-xs text-red-400 mt-1 pl-1">{fieldErrors.senha}</p>}
          </div>

          {serverError && (
            <p className="text-xs font-medium rounded-xl px-3 py-2" style={{ background: '#3b1a1a', color: '#f87171' }}>
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm border-none cursor-pointer transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>

          <p className="text-center text-xs" style={{ color: '#6b7280' }}>
            Já tem conta?{' '}
            <Link href="/login" className="font-semibold" style={{ color: '#a78bfa' }}>Entrar</Link>
          </p>
        </form>
      </div>

      <p className="text-xs mt-6" style={{ color: '#3d3d4d' }}>PODBAY © {new Date().getFullYear()}</p>
    </div>
  );
}
