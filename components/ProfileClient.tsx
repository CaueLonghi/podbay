'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Phone, MapPin, Plus, X, Star, ShieldCheck, LogOut, ShoppingBag, Pencil } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/context/AuthContext';
import { maskCep, ESTADOS, formatPrice } from '@/lib/utils';
import { useCart } from '@/context/CartContext';

interface Usuario {
  id: number;
  username: string;
  nome_completo: string;
  email: string;
  telefone: string | null;
  is_admin: boolean;
  created_at: string;
}

interface Endereco {
  id: number;
  apelido: string | null;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  principal: boolean;
}

interface Props {
  usuario: Usuario | null;
  enderecos: Endereco[];
}


export default function ProfileClient({ usuario, enderecos: initial }: Props) {
  const router = useRouter();
  const { logout } = useAuth();
  const { clearCart } = useCart();
  const [enderecos, setEnderecos] = useState<Endereco[]>(initial);
  useEffect(() => { setEnderecos(initial); }, [initial]);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [switchingId, setSwitchingId] = useState<number | null>(null);

  // ── Editar perfil ──────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState(false);
  const [editForm, setEditForm] = useState({
    nome_completo: '',
    email: '',
    telefone: '',
    senha_atual: '',
    nova_senha: '',
  });
  const [usuarioLocal, setUsuarioLocal] = useState<Usuario | null>(usuario);

  function openEdit() {
    if (!usuarioLocal) return;
    setEditForm({
      nome_completo: usuarioLocal.nome_completo,
      email: usuarioLocal.email,
      telefone: usuarioLocal.telefone ?? '',
      senha_atual: '',
      nova_senha: '',
    });
    setEditError('');
    setEditSuccess(false);
    setEditOpen(true);
  }

  async function handleEditSave(e: FormEvent) {
    e.preventDefault();
    setEditError('');
    setEditSuccess(false);
    setEditSaving(true);
    try {
      const res = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error ?? 'Erro ao salvar'); return; }
      setUsuarioLocal((prev) => prev ? { ...prev, nome_completo: editForm.nome_completo, email: editForm.email, telefone: editForm.telefone } : prev);
      setEditSuccess(true);
      setTimeout(() => { setEditOpen(false); setEditSuccess(false); router.refresh(); }, 1200);
    } catch {
      setEditError('Erro de conexão');
    } finally {
      setEditSaving(false);
    }
  }

  interface PedidoResumo {
    id: number;
    status: string;
    modalidade: string;
    valor_total: number;
    criado_em: string;
    resumo_itens: string;
  }
  const [pedidos, setPedidos] = useState<PedidoResumo[]>([]);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    if (!usuario) return;
    fetch('/api/user/pedidos')
      .then((r) => r.json())
      .then((d) => setPedidos(d.pedidos ?? []))
      .catch(() => {});
  }, [usuario]);

  const [form, setForm] = useState({
    apelido: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: 'SP',
  });

  async function handleCancelar(id: number) {
    setCancellingId(id);
    try {
      await fetch(`/api/user/pedidos/${id}`, { method: 'DELETE' });
      setPedidos((prev) => prev.map((p) => p.id === id ? { ...p, status: 'cancelado' } : p));
    } catch { /* ignore */ } finally {
      setCancellingId(null);
    }
  }

  async function handleLogout() {
    clearCart();
    await logout();
  }

  const u = usuarioLocal ?? usuario;
  if (!u) {
    return (
      <div className="flex flex-col min-h-screen pb-20 md:pb-6">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-[#3d3d4d] py-4">
          <div className="w-full max-w-screen-md mx-auto px-4 md:px-8 flex items-center gap-3">
            <h1 className="text-lg font-bold text-foreground">Perfil</h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-xs flex flex-col items-center text-center gap-5">
            <div className="w-20 h-20 rounded-full bg-surface border border-[#3d3d4d] flex items-center justify-center">
              <User size={36} className="text-muted" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold text-foreground">Você não está logado</p>
              <p className="text-sm text-muted leading-relaxed">Faça login ou crie sua conta para acessar seu perfil e endereços.</p>
            </div>
            <Link
              href="/login"
              className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold text-center hover:bg-primary/90 transition-colors"
            >
              Entrar ou criar conta
            </Link>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  const initials = u.nome_completo
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  async function fetchCep(cep: string) {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) return;
      setForm((prev) => ({
        ...prev,
        logradouro: data.logradouro || prev.logradouro,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
      }));
    } catch {
      // ignore
    }
  }

  function handleCep(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = maskCep(e.target.value);
    setForm((prev) => ({ ...prev, cep: masked }));
    if (masked.replace(/\D/g, '').length === 8) fetchCep(masked);
  }

  async function handleSetPrincipal(id: number) {
    if (switchingId) return;
    setSwitchingId(id);
    try {
      const res = await fetch(`/api/user/enderecos/${id}`, { method: 'PATCH' });
      if (!res.ok) return;
      setEnderecos((prev) =>
        prev
          .map((e) => ({ ...e, principal: e.id === id }))
          .sort((a, b) => (b.principal ? 1 : 0) - (a.principal ? 1 : 0) || a.id - b.id)
      );
    } finally {
      setSwitchingId(null);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/user/enderecos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erro ao salvar'); return; }

      // Refresh server data
      router.refresh();
      // Optimistic UI
      setEnderecos((prev) => [
        ...prev,
        {
          id: data.id,
          apelido: form.apelido || null,
          cep: form.cep,
          logradouro: form.logradouro,
          numero: form.numero,
          complemento: form.complemento || null,
          bairro: form.bairro,
          cidade: form.cidade,
          estado: form.estado,
          principal: prev.length === 0,
        },
      ]);
      setModalOpen(false);
      setForm({ apelido: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: 'SP' });
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex flex-col min-h-screen pb-20 md:pb-6">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-[#3d3d4d] py-4">
          <div className="w-full max-w-screen-md mx-auto px-4 md:px-8 flex items-center gap-3">
            <Link
              href="/"
              className="w-9 h-9 rounded-xl bg-surface border border-[#3d3d4d] flex items-center justify-center hover:border-primary active:scale-95"
              aria-label="Voltar"
            >
              <ArrowLeft size={18} className="text-foreground" />
            </Link>
            <h1 className="text-lg font-bold text-foreground">Meu Perfil</h1>
          </div>
        </header>

        <main className="flex-1 pt-6">
          <div className="w-full max-w-screen-md mx-auto px-4 md:px-8 flex flex-col gap-5">
          {/* Avatar + nome */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              {initials ? (
                <span className="text-2xl font-bold text-white">{initials}</span>
              ) : (
                <User size={36} className="text-white/80" />
              )}
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-foreground">{u.nome_completo || u.username}</p>
              {u.is_admin && (
                <Link href="/admin" className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full hover:bg-primary/20">
                  <ShieldCheck size={12} /> Admin
                </Link>
              )}
            </div>
          </div>

          {/* Info card */}
          <div className="bg-surface border border-[#3d3d4d] rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Informações da conta</h2>
              <button
                onClick={openEdit}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-xl hover:bg-primary/20 active:scale-95 transition-all"
              >
                <Pencil size={12} /> Editar
              </button>
            </div>

            <div className="flex items-center gap-3">
              <User size={16} className="text-muted flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wide">Usuário</p>
                <p className="text-sm text-foreground">@{u.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail size={16} className="text-muted flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wide">E-mail</p>
                <p className="text-sm text-foreground">{u.email}</p>
              </div>
            </div>

            {u.telefone && (
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-muted flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-wide">Telefone</p>
                  <p className="text-sm text-foreground">{u.telefone}</p>
                </div>
              </div>
            )}
          </div>

          {/* Endereços */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Endereços</h2>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-xl active:scale-95"
              >
                <Plus size={14} />
                Adicionar
              </button>
            </div>

            {enderecos.length === 0 ? (
              <div className="bg-surface border border-[#3d3d4d] rounded-2xl p-6 flex flex-col items-center gap-2 text-muted">
                <MapPin size={28} />
                <p className="text-sm">Nenhum endereço cadastrado</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {enderecos.map((end) => (
                  <button
                    key={end.id}
                    onClick={() => !end.principal && handleSetPrincipal(end.id)}
                    disabled={end.principal || switchingId !== null}
                    className={`w-full text-left border rounded-2xl p-4 flex flex-col gap-1 transition-all active:scale-[0.98] ${
                      end.principal
                        ? 'border-primary bg-primary/20'
                        : 'border-[#3d3d4d] bg-surface hover:border-primary/50 cursor-pointer'
                    } ${switchingId === end.id ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground">
                        {end.apelido || 'Endereço'}
                      </span>
                      {end.principal ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400">
                          <Star size={10} fill="currentColor" />
                          Principal
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted">Toque para definir como principal</span>
                      )}
                    </div>
                    <p className="text-sm text-foreground">
                      {end.logradouro}, {end.numero}
                      {end.complemento && ` — ${end.complemento}`}
                    </p>
                    <p className="text-xs text-muted">
                      {end.bairro} · {end.cidade}/{end.estado} · {end.cep}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
          </div>{/* /max-w wrapper */}
        </main>

        {/* Meus Pedidos */}
        <div className="w-full max-w-screen-md mx-auto px-4 md:px-8 pb-2 mt-6">
          <div className="bg-surface border border-[#3d3d4d] rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <ShoppingBag size={16} className="text-muted" />
              <h2 className="text-sm font-semibold text-foreground">Meus Pedidos</h2>
            </div>
            {pedidos.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">Nenhum pedido realizado ainda.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {pedidos.map((p) => {
                  const STATUS_COLORS: Record<string, string> = {
                    pendente:  'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
                    pago:      'text-blue-400 bg-blue-400/10 border-blue-400/30',
                    enviado:   'text-purple-400 bg-purple-400/10 border-purple-400/30',
                    entregue:  'text-green-400 bg-green-400/10 border-green-400/30',
                    cancelado: 'text-red-400 bg-red-400/10 border-red-400/30',
                  };
                  const STATUS_LABELS: Record<string, string> = {
                    pendente: 'Pendente', pago: 'Pago', enviado: 'Enviado',
                    entregue: 'Entregue', cancelado: 'Cancelado',
                  };
                  return (
                    <div key={p.id} className="border border-[#3d3d4d] rounded-xl p-3 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted">#{p.id} · {new Date(p.criado_em).toLocaleDateString('pt-BR')}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[p.status] ?? ''}`}>
                          {STATUS_LABELS[p.status] ?? p.status}
                        </span>
                      </div>
                      <p className="text-xs text-foreground leading-snug">{p.resumo_itens}</p>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="text-sm font-bold text-primary">{formatPrice(Number(p.valor_total))}</span>
                        {p.status === 'pendente' && (
                          <button
                            onClick={() => handleCancelar(p.id)}
                            disabled={cancellingId === p.id}
                            className="text-[11px] font-semibold text-red-400 border border-red-400/30 px-3 py-1 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-50"
                          >
                            {cancellingId === p.id ? 'Cancelando...' : 'Cancelar'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="w-full max-w-screen-md mx-auto px-4 md:px-8 pb-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={16} />
            Sair da conta
          </button>
        </div>

        <BottomNav />
      </div>

      {/* Modal editar perfil */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditOpen(false); }}
        >
          <div
            className="w-full max-w-mobile md:max-w-lg rounded-t-3xl md:rounded-3xl flex flex-col"
            style={{ background: '#1f1f2e', border: '1px solid #3d3d4d', maxHeight: '90vh' }}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
              <h3 className="text-base font-bold text-foreground">Editar dados</h3>
              <button onClick={() => setEditOpen(false)} className="text-muted hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSave} className="overflow-y-auto px-5 pb-8 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">Nome completo *</label>
                <input
                  required
                  value={editForm.nome_completo}
                  onChange={(e) => setEditForm((p) => ({ ...p, nome_completo: e.target.value }))}
                  className="bg-background border border-[#3d3d4d] rounded-xl px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">E-mail *</label>
                <input
                  required
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                  className="bg-background border border-[#3d3d4d] rounded-xl px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">Telefone *</label>
                <input
                  required
                  type="tel"
                  value={editForm.telefone}
                  onChange={(e) => setEditForm((p) => ({ ...p, telefone: e.target.value }))}
                  className="bg-background border border-[#3d3d4d] rounded-xl px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="h-px bg-[#3d3d4d]" />
              <p className="text-xs text-muted">Deixe em branco para não alterar a senha</p>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">Senha atual</label>
                <input
                  type="password"
                  value={editForm.senha_atual}
                  onChange={(e) => setEditForm((p) => ({ ...p, senha_atual: e.target.value }))}
                  placeholder="••••••"
                  className="bg-background border border-[#3d3d4d] rounded-xl px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">Nova senha</label>
                <input
                  type="password"
                  value={editForm.nova_senha}
                  onChange={(e) => setEditForm((p) => ({ ...p, nova_senha: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  className="bg-background border border-[#3d3d4d] rounded-xl px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {editError && (
                <p className="text-xs font-medium rounded-xl px-3 py-2" style={{ background: '#3b1a1a', color: '#f87171' }}>
                  {editError}
                </p>
              )}
              {editSuccess && (
                <p className="text-xs font-medium rounded-xl px-3 py-2 text-green-400 bg-green-400/10">
                  Dados atualizados com sucesso!
                </p>
              )}

              <button
                type="submit"
                disabled={editSaving || editSuccess}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}
              >
                {editSaving ? 'Salvando...' : editSuccess ? 'Salvo!' : 'Salvar alterações'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal novo endereço */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div
            className="w-full max-w-mobile md:max-w-lg rounded-t-3xl md:rounded-3xl flex flex-col"
            style={{ background: '#1f1f2e', border: '1px solid #3d3d4d', maxHeight: '90vh' }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
              <h3 className="text-base font-bold text-foreground">Novo endereço</h3>
              <button onClick={() => setModalOpen(false)} className="text-muted hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSave} className="overflow-y-auto px-5 pb-8 flex flex-col gap-4">
              {/* Apelido */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">Apelido (opcional)</label>
                <input
                  type="text"
                  value={form.apelido}
                  onChange={(e) => setForm((p) => ({ ...p, apelido: e.target.value }))}
                  placeholder="Casa, Trabalho..."
                  className="bg-background border border-[#3d3d4d] rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
                />
              </div>

              {/* CEP */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">CEP *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.cep}
                  onChange={handleCep}
                  placeholder="00000-000"
                  required
                  maxLength={9}
                  className="bg-background border border-[#3d3d4d] rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
                />
              </div>

              {/* Logradouro */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">Logradouro *</label>
                <input
                  type="text"
                  value={form.logradouro}
                  onChange={(e) => setForm((p) => ({ ...p, logradouro: e.target.value }))}
                  placeholder="Rua, Avenida..."
                  required
                  className="bg-background border border-[#3d3d4d] rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
                />
              </div>

              {/* Número + Complemento */}
              <div className="flex gap-3">
                <div className="flex flex-col gap-1.5 w-1/3">
                  <label className="text-xs font-medium text-muted uppercase tracking-wide">Número *</label>
                  <input
                    type="text"
                    value={form.numero}
                    onChange={(e) => setForm((p) => ({ ...p, numero: e.target.value }))}
                    placeholder="123"
                    required
                    className="bg-background border border-[#3d3d4d] rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-xs font-medium text-muted uppercase tracking-wide">Complemento</label>
                  <input
                    type="text"
                    value={form.complemento}
                    onChange={(e) => setForm((p) => ({ ...p, complemento: e.target.value }))}
                    placeholder="Apto, Bloco..."
                    className="bg-background border border-[#3d3d4d] rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Bairro */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">Bairro *</label>
                <input
                  type="text"
                  value={form.bairro}
                  onChange={(e) => setForm((p) => ({ ...p, bairro: e.target.value }))}
                  placeholder="Bairro"
                  required
                  className="bg-background border border-[#3d3d4d] rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
                />
              </div>

              {/* Cidade + Estado */}
              <div className="flex gap-3">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-xs font-medium text-muted uppercase tracking-wide">Cidade *</label>
                  <input
                    type="text"
                    value={form.cidade}
                    onChange={(e) => setForm((p) => ({ ...p, cidade: e.target.value }))}
                    placeholder="Cidade"
                    required
                    className="bg-background border border-[#3d3d4d] rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5 w-1/4">
                  <label className="text-xs font-medium text-muted uppercase tracking-wide">UF *</label>
                  <select
                    value={form.estado}
                    onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))}
                    required
                    className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    {ESTADOS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
              </div>

              {error && (
                <p className="text-xs font-medium rounded-xl px-3 py-2" style={{ background: '#3b1a1a', color: '#f87171' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}
              >
                {saving ? 'Salvando...' : 'Salvar endereço'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
