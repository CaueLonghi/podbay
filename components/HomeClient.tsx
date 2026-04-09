'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, X, Plus, User } from 'lucide-react';
import { Produto } from '@/lib/catalogo';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import BottomNav from '@/components/BottomNav';
import { formatPrice } from '@/lib/utils';

// Foto por marca+tamanho — nomeie o arquivo como: marca_tamanho.png
// Exemplos: ignite_v400mix.png · blacksheep_40kice.png · lostmary_mr600.png
// Regra: tudo minúsculo, espaços removidos, apenas letras/números
function slugBrand(marca: string, tamanho: string) {
  const slug = (s: string) => s.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  return `/brands/${slug(marca)}_${slug(tamanho)}.png`;
}

interface Props {
  produtos: Produto[];
}

interface Grupo {
  key: string;
  marca: string;
  tamanho: string;
  valor: number;
  sabores: Produto[];
}

export default function HomeClient({ produtos }: Props) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [search, setSearch]       = useState('');
  const [activeMarca, setActiveMarca] = useState('all');
  const [modalGrupo, setModalGrupo] = useState<Grupo | null>(null);

  const marcas = useMemo(() => {
    const unique = Array.from(new Set(produtos.map((p) => p.marca)));
    return unique.sort();
  }, [produtos]);

  // Agrupa por marca + tamanho
  const grupos = useMemo<Grupo[]>(() => {
    const map = new Map<string, Grupo>();
    for (const p of produtos) {
      const key = `${p.marca}||${p.tamanho}`;
      if (!map.has(key)) {
        map.set(key, { key, marca: p.marca, tamanho: p.tamanho, valor: Number(p.valor), sabores: [] });
      }
      map.get(key)!.sabores.push(p);
    }
    return Array.from(map.values());
  }, [produtos]);

  const filtered = grupos.filter((g) => {
    const term = search.trim().toLowerCase();
    const matchesSearch =
      term === '' ||
      g.marca.toLowerCase().includes(term) ||
      g.tamanho.toLowerCase().includes(term) ||
      g.sabores.some((s) => s.sabor.toLowerCase().includes(term));
    const matchesMarca = activeMarca === 'all' || g.marca === activeMarca;
    return matchesSearch && matchesMarca;
  });

  function handleAdd(produto: Produto) {
    addToCart(produto);
    showToast(`${produto.sabor} adicionado! 🛒`);
    setModalGrupo(null);
  }

  return (
    <>
      <div className="flex flex-col min-h-[calc(100vh-0px)] pb-20 md:pb-6">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-[#3d3d4d] py-3">
          <div className="w-full max-w-screen-xl mx-auto px-4 md:px-8">
            {/* Logo row — hidden on desktop (TopNav handles it) */}
            <div className="relative flex items-center justify-center mb-3 md:hidden" style={{ minHeight: '40px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/escritaPodBay.png" alt="PodBay" className="h-20 object-contain" />
              <Link
                href="/profile"
                className="absolute right-0 w-11 h-11 rounded-full flex items-center justify-center active:scale-95" style={{ background: 'rgba(167, 139, 250, 0.25)' }}
                aria-label="Ir para perfil"
              >
                <User size={20} className="text-primary" />
              </Link>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar sabor, marca ou tamanho..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface border border-[#3d3d4d] rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 pt-4 flex flex-col gap-4">
          <div className="w-full max-w-screen-xl mx-auto px-4 md:px-8 flex flex-col gap-4">
          {/* Promo Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] p-4 flex flex-col gap-1 md:flex-row md:items-center md:justify-between md:p-6">
            <div className="flex flex-col gap-1">
              <span className="text-white/80 text-xs font-medium uppercase tracking-wide">Oferta Exclusiva</span>
              <span className="text-white text-lg font-bold leading-tight">50% OFF em selecionados!</span>
              <span className="text-white/70 text-xs">Aproveite enquanto durar 🔥</span>
            </div>
          </div>

          {/* Brand Pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 md:justify-center md:flex-wrap md:overflow-visible">
            <button
              onClick={() => setActiveMarca('all')}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                activeMarca === 'all'
                  ? 'bg-primary border-primary text-white'
                  : 'bg-surface border-[#3d3d4d] text-muted hover:border-primary hover:text-primary'
              }`}
            >
              Todos
            </button>
            {marcas.map((marca) => (
              <button
                key={marca}
                onClick={() => setActiveMarca(marca)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  activeMarca === marca
                    ? 'bg-primary border-primary text-white'
                    : 'bg-surface border-[#3d3d4d] text-muted hover:border-primary hover:text-primary'
                }`}
              >
                {marca}
              </button>
            ))}
          </div>

          {/* Grupos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-foreground">
                {activeMarca === 'all' ? 'Todos os produtos' : activeMarca}
              </h2>
              <span className="text-xs text-muted">{filtered.length} modelo{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted">
                <span className="text-4xl">🔍</span>
                <p className="text-sm">Nenhum produto encontrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filtered.map((grupo) => (
                    <button
                      key={grupo.key}
                      onClick={() => setModalGrupo(grupo)}
                      className="text-left bg-surface border border-[#3d3d4d] rounded-2xl p-4 flex flex-col gap-3 hover:border-primary active:scale-[0.98] transition-all"
                    >
                      {/* Logo ou emoji */}
                      <div className="rounded-xl w-full h-48 flex items-center justify-center text-4xl select-none overflow-hidden bg-[#0f0f1e]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={slugBrand(grupo.marca, grupo.tamanho)}
                          alt={grupo.marca}
                          className="object-contain w-full h-full"
                          onError={(e) => {
                            const el = e.currentTarget;
                            el.style.display = 'none';
                            const fallback = el.nextElementSibling as HTMLElement | null;
                            if (fallback) fallback.style.display = 'block';
                          }}
                        />
                        <span style={{ display: 'none' }}>{grupo.sabores[0]?.emoji ?? '📦'}</span>
                      </div>

                      {/* Info */}
                      <div className="flex flex-col items-center gap-1 text-center">
                        <p className="text-base font-extrabold text-foreground leading-tight">{grupo.marca}</p>
                        <p className="text-sm font-semibold text-muted leading-tight">{grupo.tamanho}</p>
                        <p className="text-sm font-bold text-foreground mt-3">{formatPrice(grupo.valor)}</p>
                        <p className="text-xs text-muted">{grupo.sabores.length} sabor{grupo.sabores.length !== 1 ? 'es' : ''}</p>
                      </div>
                    </button>
                ))}
              </div>
            )}
          </div>
          </div>{/* /max-w wrapper */}
        </main>

        <BottomNav />
      </div>

      {/* WhatsApp FAB */}
      <a
        href={`https://wa.me/5511992161095?text=${encodeURIComponent(`Olá! Me chamo ${user?.username ?? 'visitante'}, consegue me ajudar?`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 md:bottom-6 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        style={{ background: '#25D366' }}
        aria-label="Falar no WhatsApp"
      >
        <svg viewBox="0 0 32 32" width="28" height="28" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 2C8.268 2 2 8.268 2 16c0 2.492.65 4.833 1.785 6.865L2 30l7.34-1.763A13.934 13.934 0 0 0 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.5a11.44 11.44 0 0 1-5.83-1.594l-.418-.248-4.354 1.047 1.074-4.24-.272-.435A11.46 11.46 0 0 1 4.5 16C4.5 9.649 9.649 4.5 16 4.5S27.5 9.649 27.5 16 22.351 27.5 16 27.5zm6.29-8.533c-.344-.172-2.036-1.004-2.352-1.119-.316-.115-.546-.172-.776.172-.23.344-.89 1.119-1.09 1.35-.2.23-.4.258-.744.086-.344-.172-1.452-.535-2.766-1.707-1.022-.912-1.712-2.037-1.912-2.381-.2-.344-.021-.53.15-.701.154-.154.344-.402.516-.603.172-.2.23-.344.344-.574.115-.23.058-.43-.029-.602-.086-.172-.776-1.87-1.063-2.56-.28-.672-.564-.58-.776-.591l-.66-.011c-.23 0-.602.086-.917.43s-1.205 1.176-1.205 2.867 1.233 3.326 1.405 3.556c.172.23 2.428 3.708 5.882 5.197.822.355 1.464.567 1.964.726.825.263 1.576.226 2.169.137.661-.099 2.036-.832 2.323-1.635.287-.803.287-1.491.2-1.635-.086-.143-.316-.23-.66-.402z"/>
        </svg>
      </a>

      {/* Modal sabores */}
      {modalGrupo && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalGrupo(null); }}
        >
          <div
            className="w-full max-w-mobile md:max-w-md rounded-t-3xl md:rounded-3xl flex flex-col"
            style={{ background: '#1f1f2e', border: '1px solid #3d3d4d', maxHeight: '85vh' }}
          >
            {/* Modal header */}
            <div className="px-5 pt-5 pb-3 flex-shrink-0">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {modalGrupo.marca} · {modalGrupo.tamanho}
                  </h3>
                  <p className="text-sm font-bold text-primary mt-0.5">{formatPrice(modalGrupo.valor)}</p>
                </div>
                <button onClick={() => setModalGrupo(null)} className="text-muted hover:text-foreground ml-4 mt-0.5">
                  <X size={20} />
                </button>
              </div>
              <p className="text-xs text-muted mt-2">Escolha seu sabor favorito:</p>
            </div>

            {/* Divider */}
            <div className="h-px bg-[#3d3d4d] mx-5" />

            {/* Sabores list */}
            <div className="overflow-y-auto px-5 py-3 flex flex-col gap-2">
              {modalGrupo.sabores.map((s) => (
                <button
                  key={s.id}
                  disabled={s.estoque === 0}
                  onClick={() => handleAdd(s)}
                  className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 transition-all text-left cursor-pointer ${
                    s.estoque === 0
                      ? 'bg-[#1a1a1a] border border-[#2a2a2a] cursor-not-allowed'
                      : 'bg-[#0f0f1e] border border-[#3d3d4d] hover:border-primary active:scale-[0.98]'
                  }`}
                >
                  <span className={`text-xl flex-shrink-0 ${s.estoque === 0 ? 'grayscale opacity-40' : ''}`}>{s.emoji ?? '📦'}</span>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className={`text-sm font-semibold leading-tight ${s.estoque === 0 ? 'line-through text-muted' : 'text-primary'}`}>{s.sabor}</span>
                    {s.descricao && s.estoque > 0 && (
                      <span className="text-[11px] text-muted leading-tight">{s.descricao}</span>
                    )}
                    {s.estoque === 0 && <span className="text-[10px] text-muted">Sem estoque</span>}
                    {s.estoque > 0 && s.estoque <= 5 && (
                      <span className="text-[10px] text-orange-400 font-semibold">Corra! Últimas {s.estoque} unidades disponíveis</span>
                    )}
                  </div>
                  {s.estoque > 0 && <Plus size={16} className="text-primary flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
