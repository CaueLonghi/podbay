'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Check, TrendingDown, TrendingUp, DollarSign } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────
interface Investimento {
  id: number;
  descricao: string | null;
  valor: number;
  data: string;
}

interface Custo {
  id: number;
  descricao: string;
  valor: number;
  mes: number;
  ano: number;
}

interface Parcela {
  id: number;
  agiotagem_id: number;
  numero: number;
  valor: number;
  pago: boolean;
  data_pagamento: string | null;
}

interface Divida {
  id: number;
  nome: string;
  valor_emprestado: number;
  valor_total: number;
  num_parcelas: number;
  criado_em: string;
  parcelas: Parcela[];
}

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

// ── Gráfico de área SVG duplo (investimentos + custos sobrepostos) ──
function AreaChart({ inv, custos }: { inv: number[]; custos: number[] }) {
  const W = 600;
  const H = 200;
  const PAD = { top: 16, right: 8, bottom: 28, left: 8 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const max = Math.max(...inv, ...custos, 1);
  const n = inv.length;

  const x = (i: number) => PAD.left + (i / (n - 1)) * chartW;
  const y = (v: number) => PAD.top + chartH - (v / max) * chartH;

  function areaPath(vals: number[]) {
    const pts = vals.map((v, i) => `${x(i)},${y(v)}`).join(' L ');
    return `M ${x(0)},${y(vals[0])} L ${pts} L ${x(n - 1)},${H - PAD.bottom} L ${x(0)},${H - PAD.bottom} Z`;
  }

  function linePath(vals: number[]) {
    return vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)},${y(v)}`).join(' ');
  }

  const labels = Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (n - 1 - i));
    return `${MESES[d.getMonth()]}`;
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 220 }}>
      <defs>
        <linearGradient id="gradInv" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="gradCus" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((t) => (
        <line key={t}
          x1={PAD.left} x2={W - PAD.right}
          y1={PAD.top + chartH * (1 - t)} y2={PAD.top + chartH * (1 - t)}
          stroke="#3d3d4d" strokeWidth="0.5" strokeDasharray="4 4"
        />
      ))}

      {/* Áreas */}
      <path d={areaPath(custos)} fill="url(#gradCus)" />
      <path d={areaPath(inv)} fill="url(#gradInv)" />

      {/* Linhas */}
      <path d={linePath(custos)} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <path d={linePath(inv)} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {/* Pontos */}
      {inv.map((v, i) => v > 0 && (
        <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="#22c55e" />
      ))}
      {custos.map((v, i) => v > 0 && (
        <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="#ef4444" />
      ))}

      {/* Labels eixo X */}
      {labels.map((l, i) => (
        <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="11" fill="#6b7280">{l}</text>
      ))}
    </svg>
  );
}

// ── SUB-TAB: Investimentos + Custos ─────────────────────────
function InvestimentosSection() {
  const now = new Date();
  const [investimentos, setInvestimentos] = useState<Investimento[]>([]);
  const [custos, setCustos] = useState<Custo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvForm, setShowInvForm] = useState(false);
  const [showCustoForm, setShowCustoForm] = useState(false);

  const [invForm, setInvForm] = useState({ descricao: '', valor: '', data: now.toISOString().slice(0, 10) });
  const [custoForm, setCustoForm] = useState({
    descricao: '', valor: '',
    mes: String(now.getMonth() + 1), ano: String(now.getFullYear()),
  });
  const [savingInv, setSavingInv] = useState(false);
  const [savingCusto, setSavingCusto] = useState(false);
  const [deletingInv, setDeletingInv] = useState<number | null>(null);
  const [deletingCusto, setDeletingCusto] = useState<number | null>(null);
  const [custoMes, setCustoMes] = useState(now.getMonth() + 1);
  const [custoAno, setCustoAno] = useState(now.getFullYear());

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/investimentos').then((r) => r.json()),
      fetch('/api/admin/custos').then((r) => r.json()),
    ]).then(([inv, cus]) => {
      setInvestimentos(inv.investimentos ?? []);
      setCustos(cus.custos ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const seriesInv = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return investimentos
      .filter((inv) => { const dd = new Date(inv.data); return dd.getMonth() === d.getMonth() && dd.getFullYear() === d.getFullYear(); })
      .reduce((s, inv) => s + Number(inv.valor), 0);
  }), [investimentos]);

  const seriesCustos = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return custos
      .filter((c) => c.mes === d.getMonth() + 1 && c.ano === d.getFullYear())
      .reduce((s, c) => s + Number(c.valor), 0);
  }), [custos]);

  const custosFiltrados = custos.filter((c) => c.mes === custoMes && c.ano === custoAno);
  const totalCustosMes = custosFiltrados.reduce((s, c) => s + Number(c.valor), 0);
  const totalInvestido = investimentos.reduce((s, i) => s + Number(i.valor), 0);

  async function handleAddInvestimento(e: React.FormEvent) {
    e.preventDefault();
    setSavingInv(true);
    const res = await fetch('/api/admin/investimentos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...invForm, valor: Number(invForm.valor) }),
    });
    const data = await res.json();
    if (res.ok) {
      setInvestimentos((prev) => [{ id: data.id, descricao: invForm.descricao || null, valor: Number(invForm.valor), data: invForm.data }, ...prev]);
      setInvForm({ descricao: '', valor: '', data: now.toISOString().slice(0, 10) });
      setShowInvForm(false);
    }
    setSavingInv(false);
  }

  async function handleDeleteInvestimento(id: number) {
    setDeletingInv(id);
    await fetch(`/api/admin/investimentos/${id}`, { method: 'DELETE' });
    setInvestimentos((prev) => prev.filter((i) => i.id !== id));
    setDeletingInv(null);
  }

  async function handleAddCusto(e: React.FormEvent) {
    e.preventDefault();
    setSavingCusto(true);
    const res = await fetch('/api/admin/custos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...custoForm, valor: Number(custoForm.valor), mes: Number(custoForm.mes), ano: Number(custoForm.ano) }),
    });
    const data = await res.json();
    if (res.ok) {
      setCustos((prev) => [{ id: data.id, descricao: custoForm.descricao, valor: Number(custoForm.valor), mes: Number(custoForm.mes), ano: Number(custoForm.ano) }, ...prev]);
      setCustoForm((f) => ({ ...f, descricao: '', valor: '' }));
      setShowCustoForm(false);
    }
    setSavingCusto(false);
  }

  async function handleDeleteCusto(id: number) {
    setDeletingCusto(id);
    await fetch(`/api/admin/custos/${id}`, { method: 'DELETE' });
    setCustos((prev) => prev.filter((c) => c.id !== id));
    setDeletingCusto(null);
  }

  if (loading) return <p className="text-xs text-muted text-center py-8">Carregando...</p>;

  return (
    <div className="flex flex-col gap-4">

      {/* ── Gráfico unificado ── */}
      <div className="bg-surface border border-[#3d3d4d] rounded-2xl p-4 flex flex-col gap-3">
        {/* Legenda + totais */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-green-400">
              <span className="w-3 h-0.5 bg-green-400 inline-block rounded" /> Investimentos
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
              <span className="w-3 h-0.5 bg-red-400 inline-block rounded" /> Custos
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-green-400 font-bold">{formatPrice(totalInvestido)}</p>
            <p className="text-xs text-red-400 font-bold">{formatPrice(totalCustosMes)} / mês</p>
          </div>
        </div>

        <AreaChart inv={seriesInv} custos={seriesCustos} />
      </div>

      {/* ── Investimentos ── */}
      <div className="bg-surface border border-[#3d3d4d] rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-foreground flex items-center gap-2">
            <TrendingUp size={15} className="text-green-400" /> Investimentos
          </p>
          <button onClick={() => setShowInvForm((v) => !v)}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 active:scale-95 transition-all">
            <Plus size={13} /> {showInvForm ? 'Cancelar' : 'Novo'}
          </button>
        </div>

        {showInvForm && (
          <form onSubmit={handleAddInvestimento} className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Descrição (opcional)" value={invForm.descricao}
                onChange={(e) => setInvForm((f) => ({ ...f, descricao: e.target.value }))}
                className="col-span-2 bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none" />
              <input required type="number" min="0" step="0.01" placeholder="Valor (R$)" value={invForm.valor}
                onChange={(e) => setInvForm((f) => ({ ...f, valor: e.target.value }))}
                className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none" />
              <input required type="date" value={invForm.data}
                onChange={(e) => setInvForm((f) => ({ ...f, data: e.target.value }))}
                className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
            </div>
            <button type="submit" disabled={savingInv}
              className="w-full bg-green-500/80 text-white rounded-xl py-2 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
              <Plus size={15} /> {savingInv ? 'Salvando...' : 'Salvar investimento'}
            </button>
          </form>
        )}

        {investimentos.length > 0 ? (
          <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto">
            {investimentos.map((inv) => (
              <div key={inv.id} className="flex items-center gap-2 bg-background border border-[#3d3d4d] rounded-xl px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{inv.descricao || '—'}</p>
                  <p className="text-[10px] text-muted">{new Date(inv.data).toLocaleDateString('pt-BR')}</p>
                </div>
                <span className="text-sm font-bold text-green-400 flex-shrink-0">{formatPrice(inv.valor)}</span>
                <button onClick={() => handleDeleteInvestimento(inv.id)} disabled={deletingInv === inv.id}
                  className="w-6 h-6 flex items-center justify-center text-muted hover:text-red-400 active:scale-95 flex-shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted text-center py-2">Nenhum investimento registrado</p>
        )}
      </div>

      {/* ── Custos Mensais ── */}
      <div className="bg-surface border border-[#3d3d4d] rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-foreground flex items-center gap-2">
            <TrendingDown size={15} className="text-red-400" /> Custos Mensais
          </p>
          <button onClick={() => setShowCustoForm((v) => !v)}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 active:scale-95 transition-all">
            <Plus size={13} /> {showCustoForm ? 'Cancelar' : 'Novo'}
          </button>
        </div>

        {showCustoForm && (
          <form onSubmit={handleAddCusto} className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <input required placeholder="Descrição" value={custoForm.descricao}
                onChange={(e) => setCustoForm((f) => ({ ...f, descricao: e.target.value }))}
                className="col-span-2 bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none" />
              <input required type="number" min="0" step="0.01" placeholder="Valor (R$)" value={custoForm.valor}
                onChange={(e) => setCustoForm((f) => ({ ...f, valor: e.target.value }))}
                className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none" />
              <select value={custoForm.mes} onChange={(e) => setCustoForm((f) => ({ ...f, mes: e.target.value }))}
                className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none">
                {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <input required type="number" min="2020" max="2099" placeholder="Ano" value={custoForm.ano}
                onChange={(e) => setCustoForm((f) => ({ ...f, ano: e.target.value }))}
                className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none" />
            </div>
            <button type="submit" disabled={savingCusto}
              className="w-full bg-red-500/80 text-white rounded-xl py-2 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
              <Plus size={15} /> {savingCusto ? 'Salvando...' : 'Salvar custo'}
            </button>
          </form>
        )}

        {/* Filtro mês */}
        <div className="flex items-center gap-2">
          <select value={custoMes} onChange={(e) => setCustoMes(Number(e.target.value))}
            className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none">
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <input type="number" value={custoAno} onChange={(e) => setCustoAno(Number(e.target.value))}
            className="w-20 bg-background border border-[#3d3d4d] rounded-xl px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none" />
          <span className="text-xs text-muted ml-auto">Total: <span className="text-red-400 font-bold">{formatPrice(totalCustosMes)}</span></span>
        </div>

        {custosFiltrados.length === 0 ? (
          <p className="text-xs text-muted text-center py-2">Nenhum custo neste mês</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {custosFiltrados.map((c) => (
              <div key={c.id} className="flex items-center gap-2 bg-background border border-[#3d3d4d] rounded-xl px-3 py-2">
                <p className="flex-1 text-xs font-semibold text-foreground truncate">{c.descricao}</p>
                <span className="text-sm font-bold text-red-400 flex-shrink-0">{formatPrice(c.valor)}</span>
                <button onClick={() => handleDeleteCusto(c.id)} disabled={deletingCusto === c.id}
                  className="w-6 h-6 flex items-center justify-center text-muted hover:text-red-400 active:scale-95 flex-shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── SUB-TAB: Agiotagem ───────────────────────────────────────
function AgiotagemSection() {
  const [dividas, setDividas] = useState<Divida[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nome: '', valor_emprestado: '', valor_total: '', num_parcelas: '1' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/admin/agiotagem')
      .then((r) => r.json())
      .then((d) => setDividas(d.dividas ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/admin/agiotagem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: form.nome, valor_emprestado: Number(form.valor_emprestado), valor_total: Number(form.valor_total), num_parcelas: Number(form.num_parcelas) }),
    });
    const data = await res.json();
    if (res.ok) {
      // Reload to get parcelas
      const r2 = await fetch('/api/admin/agiotagem').then((r) => r.json());
      setDividas(r2.dividas ?? []);
      setForm({ nome: '', valor_emprestado: '', valor_total: '', num_parcelas: '1' });
    }
    setSaving(false);
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    await fetch(`/api/admin/agiotagem/${id}`, { method: 'DELETE' });
    setDividas((prev) => prev.filter((d) => d.id !== id));
    setDeletingId(null);
  }

  async function toggleParcela(dividaId: number, parcelaId: number) {
    setTogglingId(parcelaId);
    const res = await fetch(`/api/admin/agiotagem/${dividaId}/parcelas/${parcelaId}`, { method: 'PATCH' });
    const data = await res.json();
    if (res.ok) {
      setDividas((prev) => prev.map((d) =>
        d.id !== dividaId ? d : {
          ...d,
          parcelas: d.parcelas.map((p) =>
            p.id !== parcelaId ? p : { ...p, pago: data.pago, data_pagamento: data.pago ? new Date().toISOString().slice(0, 10) : null }
          ),
        }
      ));
    }
    setTogglingId(null);
  }

  const totalAReceber = dividas.reduce((s, d) => {
    const falta = d.parcelas.filter((p) => !p.pago).reduce((ss, p) => ss + Number(p.valor), 0);
    return s + falta;
  }, 0);

  const totalEmprestado = dividas.reduce((s, d) => s + Number(d.valor_emprestado), 0);
  const totalJuros = dividas.reduce((s, d) => s + (Number(d.valor_total) - Number(d.valor_emprestado)), 0);
  const totalRecebido = dividas.reduce((s, d) => {
    return s + d.parcelas.filter((p) => p.pago).reduce((ss, p) => ss + Number(p.valor), 0);
  }, 0);

  if (loading) return <p className="text-xs text-muted text-center py-8">Carregando...</p>;

  return (
    <div className="flex flex-col gap-4">
      {/* Resumo geral */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface border border-[#3d3d4d] rounded-2xl p-3 flex flex-col gap-0.5">
          <p className="text-[10px] text-muted uppercase tracking-wider">Emprestado</p>
          <p className="text-lg font-bold text-foreground">{formatPrice(totalEmprestado)}</p>
        </div>
        <div className="bg-surface border border-green-500/30 rounded-2xl p-3 flex flex-col gap-0.5">
          <p className="text-[10px] text-muted uppercase tracking-wider">Lucro (juros)</p>
          <p className="text-lg font-bold text-green-400">{formatPrice(totalJuros)}</p>
        </div>
        <div className="bg-surface border border-yellow-500/30 rounded-2xl p-3 flex flex-col gap-0.5">
          <p className="text-[10px] text-muted uppercase tracking-wider">A receber</p>
          <p className="text-lg font-bold text-yellow-400">{formatPrice(totalAReceber)}</p>
        </div>
        <div className="bg-surface border border-blue-500/30 rounded-2xl p-3 flex flex-col gap-0.5">
          <p className="text-[10px] text-muted uppercase tracking-wider">Já recebido</p>
          <p className="text-lg font-bold text-blue-400">{formatPrice(totalRecebido)}</p>
        </div>
      </div>

      {/* Formulário nova dívida */}
      <form onSubmit={handleAdd} className="bg-surface border border-[#3d3d4d] rounded-2xl p-4 flex flex-col gap-3">
        <p className="text-sm font-bold text-foreground">Nova dívida</p>
        {form.valor_emprestado && form.valor_total && Number(form.valor_total) > Number(form.valor_emprestado) && (
          <p className="text-xs text-green-400 font-semibold">
            Juros: {formatPrice(Number(form.valor_total) - Number(form.valor_emprestado))}
            {' '}({((Number(form.valor_total) / Number(form.valor_emprestado) - 1) * 100).toFixed(1)}%)
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <input
            required placeholder="Nome do devedor" value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            className="col-span-2 bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
          />
          <input
            required type="number" min="0" step="0.01" placeholder="Emprestado (R$)" value={form.valor_emprestado}
            onChange={(e) => setForm((f) => ({ ...f, valor_emprestado: e.target.value }))}
            className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
          />
          <input
            required type="number" min="0" step="0.01" placeholder="Total a receber (R$)" value={form.valor_total}
            onChange={(e) => setForm((f) => ({ ...f, valor_total: e.target.value }))}
            className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
          />
          <input
            required type="number" min="1" max="60" placeholder="Nº parcelas" value={form.num_parcelas}
            onChange={(e) => setForm((f) => ({ ...f, num_parcelas: e.target.value }))}
            className="col-span-2 bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
          />
        </div>
        <button type="submit" disabled={saving}
          className="w-full bg-yellow-500/80 text-white rounded-xl py-2 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
          <Plus size={16} /> {saving ? 'Salvando...' : 'Adicionar dívida'}
        </button>
      </form>

      {/* Lista de dívidas */}
      {dividas.length === 0 ? (
        <p className="text-xs text-muted text-center py-4">Nenhuma dívida cadastrada</p>
      ) : (
        <div className="flex flex-col gap-3">
          {dividas.map((d) => {
            const pagas = d.parcelas.filter((p) => p.pago).length;
            const total = d.parcelas.length;
            const recebido = d.parcelas.filter((p) => p.pago).reduce((s, p) => s + Number(p.valor), 0);
            const falta = Number(d.valor_total) - recebido;
            return (
              <div key={d.id} className="bg-surface border border-[#3d3d4d] rounded-2xl p-4 flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-foreground">{d.nome}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      <span className="text-xs text-muted">Emp. <span className="text-foreground font-semibold">{formatPrice(d.valor_emprestado)}</span></span>
                      <span className="text-xs text-muted">Total <span className="text-foreground font-semibold">{formatPrice(d.valor_total)}</span></span>
                      <span className="text-xs text-green-400 font-semibold">+{formatPrice(Number(d.valor_total) - Number(d.valor_emprestado))} juros</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      {pagas}/{total} parcelas
                      {falta > 0 && <span className="ml-1 text-yellow-400 font-semibold">· falta {formatPrice(falta)}</span>}
                      {falta === 0 && <span className="ml-1 text-green-400 font-semibold">· quitado ✓</span>}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(d.id)} disabled={deletingId === d.id}
                    className="w-7 h-7 flex items-center justify-center text-muted hover:text-red-400 active:scale-95 flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Barra de progresso */}
                <div className="w-full h-1.5 bg-[#2a2a3d] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-400 transition-all"
                    style={{ width: `${total > 0 ? (pagas / total) * 100 : 0}%` }}
                  />
                </div>

                {/* Checklist de parcelas */}
                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                  {d.parcelas.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => toggleParcela(d.id, p.id)}
                      disabled={togglingId === p.id}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
                        p.pago
                          ? 'bg-green-500/20 border-green-500/40 text-green-400'
                          : 'bg-background border-[#3d3d4d] text-muted hover:border-primary/50'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 ${p.pago ? 'bg-green-500' : 'bg-[#2a2a3d]'}`}>
                        {p.pago && <Check size={9} className="text-white" />}
                      </div>
                      <span>{p.numero}ª</span>
                      <span className="text-[10px] text-muted/70">{formatPrice(p.valor).replace('R$\u00a0', '')}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Export principal ─────────────────────────────────────────
export default function InvestimentosTab() {
  const [subTab, setSubTab] = useState<'investimentos' | 'agiotagem'>('investimentos');

  return (
    <div className="flex flex-col gap-4">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {(['investimentos', 'agiotagem'] as const).map((t) => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
              subTab === t ? 'bg-primary text-white border-primary' : 'bg-surface text-muted border-[#3d3d4d] hover:border-primary/50'
            }`}>
            {t === 'investimentos' ? 'Investimentos & Custos' : '💸 Agiotagem'}
          </button>
        ))}
      </div>

      {subTab === 'investimentos' ? <InvestimentosSection /> : <AgiotagemSection />}
    </div>
  );
}
