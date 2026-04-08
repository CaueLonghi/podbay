'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, MapPin, Plus, ChevronRight, Truck, Store, Clock, Banknote, QrCode } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import CartItem from '@/components/CartItem';
import BottomNav from '@/components/BottomNav';
import { formatPrice, maskCep, ESTADOS } from '@/lib/utils';

const WA_NUMBER = '5511992161095';

type Modalidade = 'entrega' | 'retirada';
type MetodoPagamento = 'dinheiro' | 'pix';

const METODOS: { key: MetodoPagamento; label: string; desc: string; icon: React.ReactNode }[] = [
  { key: 'pix',      label: 'PIX',      desc: 'Pagamento instantâneo',   icon: <QrCode size={20} /> },
  { key: 'dinheiro', label: 'Dinheiro', desc: 'Pague na retirada', icon: <Banknote size={20} /> },
];

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

const emptyForm = { apelido: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: 'SP' };

function gerarHorarios(): string[] {
  const slots: string[] = [];
  for (let h = 11; h <= 20; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}

const HORARIOS = gerarHorarios();

export default function CartPage() {
  const { items, finishOrder, totalPrice } = useCart();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [observacao, setObservacao] = useState('');
  const [modalidade, setModalidade] = useState<Modalidade | null>(null);
  const [horario, setHorario] = useState<string>('');
  const [pagamento, setPagamento] = useState<MetodoPagamento | null>(null);

  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [loadingAddr, setLoadingAddr] = useState(true);
  const [savingAddr, setSavingAddr] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [waUrl, setWaUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [pedidoPendente, setPedidoPendente] = useState(false);

  const principal = enderecos.find((e) => e.principal === true) ?? null;

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setShowLoginModal(items.length > 0);
      setLoadingAddr(false);
      return;
    }
    Promise.all([
      fetch('/api/user/enderecos').then((r) => r.json()),
      fetch('/api/pedidos/pendente').then((r) => r.json()),
    ])
      .then(([addrsData, pendingData]) => {
        setEnderecos(addrsData.enderecos ?? []);
        setPedidoPendente(pendingData.pendente === true);
      })
      .catch(() => {})
      .finally(() => setLoadingAddr(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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
    } catch { /* ignore */ }
  }

  function handleCep(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = maskCep(e.target.value);
    setForm((prev) => ({ ...prev, cep: masked }));
    if (masked.replace(/\D/g, '').length === 8) fetchCep(masked);
  }

  async function handleSaveAddress(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    setSavingAddr(true);
    try {
      const res = await fetch('/api/user/enderecos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Erro ao salvar'); return; }
      const novo: Endereco = {
        id: data.id,
        apelido: form.apelido || null,
        cep: form.cep,
        logradouro: form.logradouro,
        numero: form.numero,
        complemento: form.complemento || null,
        bairro: form.bairro,
        cidade: form.cidade,
        estado: form.estado,
        principal: true,
      };
      setEnderecos([novo]);
      setForm(emptyForm);
      showToast('Endereco salvo!');
    } catch {
      setFormError('Erro de conexao. Tente novamente.');
    } finally {
      setSavingAddr(false);
    }
  }

  function canFinish() {
    return !pedidoPendente && !!modalidade && !!pagamento &&
      (modalidade === 'entrega' ? !!principal : !!horario);
  }

  async function handleFinish() {
    if (!canFinish() || finishing) return;
    setFinishing(true);

    // Monta a mensagem do WhatsApp antes de qualquer coisa
    const lista = items.map((item, i) => {
      const qty = item.quantity > 1 ? ` x${item.quantity}` : '';
      const subtotal = item.quantity > 1 ? ` (subtotal: ${formatPrice(item.price * item.quantity)})` : '';
      return `${i + 1}) *${item.marca} ${item.tamanho}*\n    ${item.sabor}${qty} - ${formatPrice(item.price)}${subtotal}`;
    }).join('\n');

    let linhasEntrega: string[];
    if (modalidade === 'entrega' && principal) {
      const complemento = principal.complemento ? ` / ${principal.complemento}` : '';
      const apelido = principal.apelido ? ` (${principal.apelido})` : '';
      linhasEntrega = [
        `*Endereco de entrega:*${apelido}`,
        `${principal.logradouro}, ${principal.numero}${complemento}`,
        `${principal.bairro} - ${principal.cidade}/${principal.estado}`,
        `CEP: ${principal.cep}`,
      ];
    } else {
      linhasEntrega = [`*Retirada no local*`, `Horario: ${horario}`];
    }

    const msg = [
      `*Gostaria de fazer um pedido!*`, ``,
      `*Itens:*`, lista, ``,
      `*Total: ${formatPrice(totalPrice)}*`,
      `*Pagamento: ${pagamento === 'pix' ? 'PIX' : 'Dinheiro'}*`, ``,
      ...linhasEntrega,
      ...(observacao.trim() ? [``, `*Observacao:* ${observacao.trim()}`] : []),
    ].join('\n');

    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    setWaUrl(url);

    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modalidade,
          metodo_pagamento: pagamento,
          endereco_id: modalidade === 'entrega' && principal ? principal.id : null,
          horario_retirada: modalidade === 'retirada' ? horario : null,
          itens: items.map((item) => ({
            produto_id: item.product_id,
            nome_produto: item.marca,
            sabor: item.sabor,
            tamanho: item.tamanho,
            valor_unitario: item.price,
            quantidade: item.quantity,
          })),
        }),
      });

      if (!res.ok) throw new Error('api_error');

      // Sucesso: mostra modal e redireciona para WA após 3s
      finishOrder();
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        window.open(url, '_blank');
      }, 5000);
    } catch {
      setShowErrorModal(true);
    } finally {
      setFinishing(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-6">
      {showLoginModal && !user && items.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm px-0 md:px-4">
          <div className="w-full max-w-mobile md:max-w-sm bg-surface border border-[#3d3d4d] rounded-t-3xl md:rounded-3xl p-6 flex flex-col gap-5 shadow-2xl">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <ShoppingCart size={30} className="text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground leading-snug">
                Gostou de algum produto?
              </h2>
              <p className="text-sm text-muted leading-relaxed">
                Faça Login ou crie sua conta agora mesmo para ter acesso a descontos exclusivos!
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold text-center hover:bg-primary/90 transition-colors"
              >
                Entrar ou criar conta
              </Link>
              <button
                onClick={() => setShowLoginModal(false)}
                className="w-full py-3 rounded-xl text-sm text-muted hover:text-foreground transition-colors"
              >
                Continuar navegando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de erro ao registrar pedido */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm px-0 md:px-4">
          <div className="w-full max-w-mobile md:max-w-sm bg-surface border border-[#3d3d4d] rounded-t-3xl md:rounded-3xl p-6 flex flex-col gap-5 shadow-2xl">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
              <h2 className="text-lg font-bold text-foreground">Erro ao registrar pedido</h2>
              <p className="text-sm text-muted leading-relaxed">
                Não conseguimos registrar seu pedido no sistema. Entre em contato com nosso especialista pelo WhatsApp para finalizar seu atendimento.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href={`https://wa.me/${WA_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white hover:opacity-90 active:scale-[0.98] transition-all"
                style={{ background: '#25D366' }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.856L.057 23.143a.75.75 0 0 0 .9.921l5.393-1.44A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.7-.512-5.243-1.406l-.374-.22-3.862 1.031 1.058-3.758-.243-.389A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                Falar com especialista
              </a>
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full py-3 rounded-xl text-sm text-muted hover:text-foreground transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de sucesso — pedido registrado */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm px-0 md:px-4">
          <div className="w-full max-w-mobile md:max-w-sm bg-surface border border-[#3d3d4d] rounded-t-3xl md:rounded-3xl p-6 flex flex-col gap-5 shadow-2xl">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-green-400" style={{ color: '#25D366' }}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.856L.057 23.143a.75.75 0 0 0 .9.921l5.393-1.44A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.7-.512-5.243-1.406l-.374-.22-3.862 1.031 1.058-3.758-.243-.389A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
              </div>
              <h2 className="text-lg font-bold text-foreground">Pedido registrado!</h2>
              <p className="text-sm text-muted leading-relaxed">
                Seu pedido foi registrado com sucesso. Em instantes você será direcionado ao WhatsApp para continuar o atendimento com nosso especialista.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Redirecionando em 5 segundos...
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-[#3d3d4d] py-4">
        <div className="w-full max-w-screen-lg mx-auto px-4 md:px-8 flex items-center gap-3">
          <Link
            href="/"
            className="w-9 h-9 rounded-xl bg-surface border border-[#3d3d4d] flex items-center justify-center hover:border-primary active:scale-95"
            aria-label="Voltar"
          >
            <ArrowLeft size={18} className="text-foreground" />
          </Link>
          <h1 className="text-lg font-bold text-foreground">Carrinho</h1>
          {items.length > 0 && (
            <span className="ml-auto text-sm text-muted">{items.length} {items.length === 1 ? 'item' : 'itens'}</span>
          )}
        </div>
      </header>

      <main className="flex-1 pt-4">
        <div className="w-full max-w-screen-lg mx-auto px-4 md:px-8">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center">
                <ShoppingCart size={36} className="text-muted" />
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-foreground">Carrinho vazio</p>
                <p className="text-sm text-muted mt-1">Adicione produtos para continuar</p>
              </div>
              <Link href="/" className="mt-2 bg-primary text-white rounded-xl px-6 py-3 text-sm font-semibold hover:bg-secondary active:scale-95">
                Ver Produtos
              </Link>
            </div>
          ) : (
            <div className="md:grid md:grid-cols-[1fr_340px] md:gap-6 md:items-start flex flex-col gap-3 pb-4">
              {/* LEFT: items + modalidade + delivery */}
              <div className="flex flex-col gap-3">
                {/* Cart Items */}
                <div className="flex flex-col gap-3">
                  {items.map((item) => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </div>

                {/* Modalidade */}
                <div className="bg-surface border border-[#3d3d4d] rounded-2xl p-4 flex flex-col gap-3">
                  <h2 className="text-sm font-semibold text-foreground">Forma de recebimento</h2>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { setModalidade('entrega'); if (pagamento === 'dinheiro') setPagamento(null); }}
                      className={`flex flex-col items-center gap-2 rounded-xl py-4 border transition-all ${
                        modalidade === 'entrega'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-[#3d3d4d] text-muted hover:border-primary/50'
                      }`}
                    >
                      <Truck size={22} />
                      <span className="text-sm font-semibold">Entrega</span>
                    </button>
                    <button
                      onClick={() => setModalidade('retirada')}
                      className={`flex flex-col items-center gap-2 rounded-xl py-4 border transition-all ${
                        modalidade === 'retirada'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-[#3d3d4d] text-muted hover:border-primary/50'
                      }`}
                    >
                      <Store size={22} />
                      <span className="text-sm font-semibold">Retirada</span>
                    </button>
                  </div>
                </div>

                {/* Método de pagamento */}
                {modalidade && <div className="bg-surface border border-[#3d3d4d] rounded-2xl p-4 flex flex-col gap-3">
                  <h2 className="text-sm font-semibold text-foreground">Forma de pagamento</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {METODOS.filter(({ key }) => !(modalidade === 'entrega' && key === 'dinheiro')).map(({ key, label, desc, icon }) => (
                      <button
                        key={key}
                        onClick={() => setPagamento(key)}
                        className={`flex flex-col items-center gap-2 rounded-xl py-4 px-3 border transition-all ${
                          pagamento === key
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-[#3d3d4d] text-muted hover:border-primary/50'
                        }`}
                      >
                        {icon}
                        <span className="text-sm font-semibold">{label}</span>
                        <span className="text-[10px] text-center leading-tight opacity-70">{desc}</span>
                      </button>
                    ))}
                  </div>
                </div>}

                {/* Entrega: endereço */}
                {modalidade === 'entrega' && (
                  <div className="bg-surface border border-[#3d3d4d] rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-primary" />
                        <h2 className="text-sm font-semibold text-foreground">Endereco de entrega</h2>
                      </div>
                      {principal && (
                        <Link href="/profile" className="text-xs text-primary flex items-center gap-0.5">
                          Trocar <ChevronRight size={12} />
                        </Link>
                      )}
                    </div>

                    {loadingAddr ? (
                      <p className="text-xs text-muted">Carregando endereco...</p>
                    ) : principal ? (
                      <div className="bg-background rounded-xl px-3 py-2.5 flex flex-col gap-0.5">
                        {principal.apelido && (
                          <span className="text-xs font-bold text-primary">{principal.apelido}</span>
                        )}
                        <p className="text-sm text-foreground">
                          {principal.logradouro}, {principal.numero}
                          {principal.complemento ? ` - ${principal.complemento}` : ''}
                        </p>
                        <p className="text-xs text-muted">{principal.bairro}, {principal.cidade} - {principal.cep}</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-orange-400 font-medium">Cadastre um endereco para finalizar o pedido</p>
                        <form onSubmit={handleSaveAddress} className="flex flex-col gap-2.5 mt-1">
                          <div className="grid grid-cols-2 gap-2">
                            <input placeholder="Apelido (ex: Casa)" value={form.apelido}
                              onChange={(e) => setForm((p) => ({ ...p, apelido: e.target.value }))}
                              className="col-span-2 bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary" />
                            <input placeholder="CEP" value={form.cep} onChange={handleCep} required
                              className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary" />
                            <select value={form.estado} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))} required
                              className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground focus:border-primary">
                              {ESTADOS.map((uf) => <option key={uf}>{uf}</option>)}
                            </select>
                            <input placeholder="Logradouro" value={form.logradouro} required
                              onChange={(e) => setForm((p) => ({ ...p, logradouro: e.target.value }))}
                              className="col-span-2 bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary" />
                            <input placeholder="Numero" value={form.numero} required
                              onChange={(e) => setForm((p) => ({ ...p, numero: e.target.value }))}
                              className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary" />
                            <input placeholder="Complemento" value={form.complemento}
                              onChange={(e) => setForm((p) => ({ ...p, complemento: e.target.value }))}
                              className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary" />
                            <input placeholder="Bairro" value={form.bairro} required
                              onChange={(e) => setForm((p) => ({ ...p, bairro: e.target.value }))}
                              className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary" />
                            <input placeholder="Cidade" value={form.cidade} required
                              onChange={(e) => setForm((p) => ({ ...p, cidade: e.target.value }))}
                              className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary" />
                          </div>
                          {formError && <p className="text-xs text-red-400">{formError}</p>}
                          <button type="submit" disabled={savingAddr}
                            className="w-full bg-primary text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                            <Plus size={16} /> {savingAddr ? 'Salvando...' : 'Salvar endereco'}
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                )}

                {/* Retirada: horário */}
                {modalidade === 'retirada' && (
                  <div className="bg-surface border border-[#3d3d4d] rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-primary" />
                      <h2 className="text-sm font-semibold text-foreground">Horario de retirada</h2>
                    </div>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {HORARIOS.map((h) => (
                        <button
                          key={h}
                          onClick={() => setHorario(h)}
                          className={`rounded-xl py-2 text-xs font-semibold border transition-all ${
                            horario === h
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-[#3d3d4d] text-muted hover:border-primary/50'
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT: summary + button (sticky on desktop) */}
              <div className="flex flex-col gap-3 md:sticky md:top-[calc(56px+16px)]">
                {/* Observação */}
                <div className="bg-surface border border-[#3d3d4d] rounded-2xl p-4 flex flex-col gap-2">
                  <h2 className="text-sm font-semibold text-foreground">Observação</h2>
                  <textarea
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Ex: Troco para R$ 100..."
                    rows={3}
                    className="w-full bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                {/* Summary */}
                <div className="bg-surface border border-[#3d3d4d] rounded-2xl p-4 flex flex-col gap-3">
                  <h2 className="text-sm font-semibold text-foreground">Resumo do pedido</h2>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-semibold">Total</span>
                    <span className="text-primary font-bold text-lg">{formatPrice(totalPrice)}</span>
                  </div>
                </div>

                {pedidoPendente && (
                  <div className="flex flex-col gap-2">
                    <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-2xl px-4 py-3 flex items-start gap-2">
                      <span className="text-yellow-400 text-base leading-none mt-0.5">⚠</span>
                      <p className="text-xs text-yellow-400 font-medium leading-relaxed">
                        Voce ja possui um pedido pendente. Aguarde a confirmacao antes de fazer um novo pedido.
                      </p>
                    </div>
                    <a
                      href={`https://wa.me/${WA_NUMBER}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
                      style={{ background: '#25D366' }}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.856L.057 23.143a.75.75 0 0 0 .9.921l5.393-1.44A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.7-.512-5.243-1.406l-.374-.22-3.862 1.031 1.058-3.758-.243-.389A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                      </svg>
                      Falar com especialista
                    </a>
                  </div>
                )}
                <button
                  onClick={handleFinish}
                  disabled={!canFinish()}
                  className="w-full bg-primary hover:bg-secondary text-white rounded-2xl py-4 text-base font-bold active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {pedidoPendente
                    ? 'Pedido pendente em aberto'
                    : !modalidade
                    ? 'Selecione a forma de recebimento'
                    : !pagamento
                    ? 'Selecione a forma de pagamento'
                    : modalidade === 'entrega' && !principal
                    ? 'Cadastre um endereco para continuar'
                    : modalidade === 'retirada' && !horario
                    ? 'Selecione um horario de retirada'
                    : 'Finalizar Pedido'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
