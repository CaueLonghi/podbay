'use client';

import { useState, useMemo, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, PackageSearch, TrendingUp, ShoppingBag, Check, Pencil, X, MapPin, CreditCard, Clock, Truck, Store, Tag } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import InvestimentosTab from '@/components/InvestimentosTab';

interface Produto {
  id: number;
  marca: string;
  sabor: string;
  descricao: string | null;
  tamanho: string;
  valor: number;
  custo: number;
  estoque: number;
  emoji: string | null;
  ativo: number;
  novo: boolean;
  foto_url: string | null;
}

interface ItemPedido {
  nome_produto: string;
  sabor: string;
  tamanho: string;
  valor_unitario: number;
  custo_unitario: number;
  quantidade: number;
}

interface Pedido {
  id: number;
  status: 'pendente' | 'pago' | 'pagamento_recusado' | 'enviado' | 'entregue' | 'cancelado';
  modalidade: 'entrega' | 'retirada';
  horario_retirada: string | null;
  metodo_pagamento: 'pix' | 'cartao_credito' | 'boleto' | null;
  valor_subtotal: number;
  desconto: number;
  valor_frete: number;
  valor_total: number;
  obs: string | null;
  criado_em: string;
  username: string;
  nome_completo: string | null;
  telefone: string | null;
  end_apelido: string | null;
  end_logradouro: string | null;
  end_numero: string | null;
  end_complemento: string | null;
  end_bairro: string | null;
  end_cidade: string | null;
  end_estado: string | null;
  end_cep: string | null;
  itens: ItemPedido[];
}

interface Props {
  produtos: Produto[];
}

type Tab = 'vendas' | 'estoque' | 'faturamento' | 'investimentos' | 'promocoes';
type StatusPedido = 'pendente' | 'pago' | 'pagamento_recusado' | 'enviado' | 'entregue' | 'cancelado';
type ModalidadeFiltro = 'all' | 'entrega' | 'retirada';

const STATUS_LABELS: Record<StatusPedido, string> = {
  pendente:           'Pendente',
  pago:               'Pago',
  pagamento_recusado: 'Recusado',
  enviado:            'Enviado',
  entregue:           'Entregue',
  cancelado:          'Cancelado',
};

const STATUS_COLORS: Record<StatusPedido, string> = {
  pendente:           'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  pago:               'text-blue-400 bg-blue-400/10 border-blue-400/30',
  pagamento_recusado: 'text-red-400 bg-red-400/10 border-red-400/30',
  enviado:            'text-purple-400 bg-purple-400/10 border-purple-400/30',
  entregue:           'text-green-400 bg-green-400/10 border-green-400/30',
  cancelado:          'text-red-400 bg-red-400/10 border-red-400/30',
};

const METODO_LABELS: Record<string, string> = {
  pix:          'PIX',
  credit_card:  'Cartão',
  debit_card:   'Débito',
  cartao_credito: 'Cartão',
  boleto:       'Boleto',
  dinheiro:     'Dinheiro',
};

const STATUS_SEQUENCE: StatusPedido[] = ['pendente', 'pago', 'enviado', 'entregue', 'cancelado'];

const emptyForm = { marca: '', sabor: '', descricao: '', tamanho: '', valor: '', custo: '', estoque: '0', emoji: '', foto_url: '' };


// ── Faturamento ──────────────────────────────────────────────
type PeriodoFiltro = 'hoje' | '7dias' | 'mes_atual' | 'mes_passado' | 'tudo';

const PERIODO_LABELS: Record<PeriodoFiltro, string> = {
  hoje:        'Hoje',
  '7dias':     'Últimos 7 dias',
  mes_atual:   'Mês atual',
  mes_passado: 'Mês passado',
  tudo:        'Tudo',
};

function filtrarPorPeriodo(pedidos: Pedido[], periodo: PeriodoFiltro): Pedido[] {
  if (periodo === 'tudo') return pedidos;
  const agora = new Date();
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

  return pedidos.filter((p) => {
    const criado = new Date(p.criado_em);
    if (periodo === 'hoje') {
      return criado >= hoje;
    }
    if (periodo === '7dias') {
      const limite = new Date(hoje);
      limite.setDate(limite.getDate() - 6);
      return criado >= limite;
    }
    if (periodo === 'mes_atual') {
      return criado.getFullYear() === agora.getFullYear() && criado.getMonth() === agora.getMonth();
    }
    if (periodo === 'mes_passado') {
      const mesPassado = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
      return criado.getFullYear() === mesPassado.getFullYear() && criado.getMonth() === mesPassado.getMonth();
    }
    return true;
  });
}

interface ResumoFinanceiro {
  total_vendas: number;
  faturamento: number;
  total_frete: number;
  lucro: number;
}

function FaturamentoTab({ pedidos, produtos }: { pedidos: Pedido[]; produtos: Produto[] }) {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('mes_atual');
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null);

  useEffect(() => {
    setResumo(null);
    fetch(`/api/admin/faturamento?periodo=${periodo}`)
      .then((r) => r.json())
      .then(setResumo)
      .catch(() => {});
  }, [periodo]);

  // Pedidos filtrados pelo período — usados para gráfico, marcas e distribuição
  const pedidosPeriodo = filtrarPorPeriodo(pedidos, periodo);
  const vendidos = pedidosPeriodo.filter((p) => p.status !== 'cancelado' && p.status !== 'pendente');
  const concluidos = pedidosPeriodo.filter((p) => p.status === 'entregue');

  const totalVendas  = resumo?.total_vendas ?? 0;
  const faturamento  = resumo?.faturamento  ?? 0;
  const totalFrete   = resumo?.total_frete  ?? 0;
  const lucro        = resumo?.lucro        ?? 0;

  const totalEntregas  = vendidos.filter((p) => p.modalidade === 'entrega').length;
  const totalRetiradas = vendidos.filter((p) => p.modalidade === 'retirada').length;

  // Distribuicao de status (pedidos do período)
  const statusDist = STATUS_SEQUENCE.map((s) => ({
    status: s,
    count: pedidosPeriodo.filter((p) => p.status === s).length,
  }));

  // Marcas mais vendidas — apenas pedidos entregues
  const marcasMap: Record<string, number> = {};
  for (const pedido of concluidos) {
    for (const item of pedido.itens) {
      marcasMap[item.nome_produto] = (marcasMap[item.nome_produto] ?? 0) + item.quantidade;
    }
  }
  const marcasRank = Object.entries(marcasMap).sort((a, b) => b[1] - a[1]);
  const maxMarca = marcasRank[0]?.[1] ?? 1;

  function exportarCSV() {
    const linhas: string[] = [
      'Pedido ID;Data;Cliente;Marca;Sabor;Tamanho;Qtd;Valor Unit.;Subtotal Item',
    ];
    for (const pedido of concluidos) {
      const data = new Date(pedido.criado_em).toLocaleDateString('pt-BR');
      const cliente = pedido.nome_completo || pedido.username;
      for (const item of pedido.itens) {
        const subtotal = (item.valor_unitario * item.quantidade).toFixed(2).replace('.', ',');
        const unitario = Number(item.valor_unitario).toFixed(2).replace('.', ',');
        linhas.push(
          `${pedido.id};${data};${cliente};${item.nome_produto};${item.sabor};${item.tamanho};${item.quantidade};${unitario};${subtotal}`
        );
      }
    }
    const bom = '\uFEFF'; // BOM para Excel reconhecer UTF-8
    const blob = new Blob([bom + linhas.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `itens_pedidos_entregues_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Faturamento por dia ──────────────────────────────────────
  const faturamentoPorDia = (() => {
    // Gera lista de datas do período
    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    let dias: Date[] = [];

    if (periodo === 'hoje') {
      dias = [hoje];
    } else if (periodo === '7dias') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(hoje);
        d.setDate(d.getDate() - i);
        dias.push(d);
      }
    } else if (periodo === 'mes_atual') {
      const totalDias = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= totalDias; i++) {
        dias.push(new Date(agora.getFullYear(), agora.getMonth(), i));
      }
    } else if (periodo === 'mes_passado') {
      const ano = agora.getMonth() === 0 ? agora.getFullYear() - 1 : agora.getFullYear();
      const mes = agora.getMonth() === 0 ? 11 : agora.getMonth() - 1;
      const totalDias = new Date(ano, mes + 1, 0).getDate();
      for (let i = 1; i <= totalDias; i++) {
        dias.push(new Date(ano, mes, i));
      }
    } else {
      // tudo: agrupar por dia com os pedidos existentes
      const datesSet = new Set(vendidos.map((p) => new Date(p.criado_em).toLocaleDateString('pt-BR')));
      const sorted = Array.from(datesSet).sort((a, b) => {
        const [da, ma, ya] = a.split('/').map(Number);
        const [db, mb, yb] = b.split('/').map(Number);
        return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
      });
      return sorted.map((label) => ({
        label,
        valor: vendidos
          .filter((p) => new Date(p.criado_em).toLocaleDateString('pt-BR') === label)
          .reduce((s, p) => s + Number(p.valor_total), 0),
      }));
    }

    return dias.map((d) => {
      const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const valor = vendidos
        .filter((p) => {
          const c = new Date(p.criado_em);
          return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth() && c.getDate() === d.getDate();
        })
        .reduce((s, p) => s + Number(p.valor_total), 0);
      return { label, valor };
    });
  })();

  const maxDia = Math.max(...faturamentoPorDia.map((d) => d.valor), 1);

  // Estoque: todos os produtos ativos com estoque >= 0
  const produtosAtivos = produtos.filter((p) => p.ativo === 1);
  const totalSabores = produtosAtivos.length;
  const semEstoque = produtosAtivos.filter((p) => p.estoque === 0).length;
  const comEstoque = totalSabores - semEstoque;
  const criticos = produtosAtivos.filter((p) => p.estoque > 0 && p.estoque < 5).sort((a, b) => a.estoque - b.estoque);

  // Barra de estoque: porcentagem de sabores disponíveis
  const pctDisponivel = totalSabores > 0 ? Math.round((comEstoque / totalSabores) * 100) : 0;

  return (
    <div className="flex flex-col gap-4 pb-6 md:grid md:grid-cols-2 md:gap-6 md:items-start">

      {/* Filtro de período */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5 md:col-span-2">
        {(Object.keys(PERIODO_LABELS) as PeriodoFiltro[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              periodo === p
                ? 'bg-primary/15 text-primary border-primary'
                : 'bg-surface text-muted border-[#3d3d4d] hover:border-primary/40'
            }`}
          >
            {PERIODO_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Cards: Vendas, Faturamento, Lucro, Frete */}
      <div className="grid grid-cols-2 gap-3 md:col-span-2">
        <div className="bg-surface border border-[#3d3d4d] rounded-2xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Total de vendas</p>
          <p className="text-3xl font-black text-foreground">{totalVendas}</p>
          <p className="text-[10px] text-muted">pedidos concluidos</p>
        </div>
        <div className="bg-surface border border-primary/30 rounded-2xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Faturamento</p>
          <p className="text-2xl font-black text-primary leading-tight">
            {formatPrice(faturamento)}
          </p>
          <p className="text-[10px] text-muted">soma dos pedidos</p>
        </div>
        <div className="bg-surface border border-green-500/30 rounded-2xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Lucro estimado</p>
          <p className={`text-2xl font-black leading-tight ${lucro >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatPrice(lucro)}
          </p>
          <p className="text-[10px] text-muted">faturamento − custo</p>
        </div>
        <div className="bg-surface border border-blue-500/30 rounded-2xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Gasto com frete</p>
          <p className="text-2xl font-black text-blue-400 leading-tight">
            {formatPrice(totalFrete)}
          </p>
          <p className="text-[10px] text-muted">soma dos fretes</p>
        </div>
      </div>

      {/* Gráfico: faturamento por dia */}
      <div className="bg-surface border border-[#3d3d4d] rounded-2xl p-4 flex flex-col gap-3 md:col-span-2">
        <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Faturamento por dia</p>
        {faturamentoPorDia.every((d) => d.valor === 0) ? (
          <p className="text-xs text-muted py-4 text-center">Nenhum faturamento no período</p>
        ) : (
          <div>
            {/* Barras */}
            <div className="flex items-end gap-[2px] h-40 mt-2">
              {faturamentoPorDia.map((dia, i) => {
                const pct = maxDia > 0 ? (dia.valor / maxDia) * 100 : 0;
                const isHovered = hoveredBar === i;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer"
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {dia.valor > 0 && (
                      <span
                        className="text-[8px] font-bold leading-none mb-0.5 transition-colors"
                        style={{ color: isHovered ? '#a78bfa' : '#9ca3af', writingMode: faturamentoPorDia.length > 10 ? 'vertical-rl' : 'horizontal-tb', transform: faturamentoPorDia.length > 10 ? 'rotate(180deg)' : undefined }}
                      >
                        {dia.valor >= 1000
                          ? `${(dia.valor / 1000).toFixed(1).replace('.', ',')}k`
                          : dia.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    )}
                    <div
                      className={`w-full rounded-t-sm transition-all ${isHovered ? 'bg-primary' : 'bg-primary/40'}`}
                      style={{ height: `${Math.max(pct, dia.valor > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                );
              })}
            </div>
            {/* Eixo X — labels */}
            {faturamentoPorDia.length <= 31 && (
              <div className="flex gap-[2px] mt-1">
                {faturamentoPorDia.map((dia, i) => (
                  <div key={i} className="flex-1 text-center">
                    {/* Mostrar label apenas a cada N barras para não sobrepor */}
                    {(faturamentoPorDia.length <= 7 ||
                      (faturamentoPorDia.length <= 14 && i % 2 === 0) ||
                      (faturamentoPorDia.length > 14 && (i === 0 || i === Math.floor(faturamentoPorDia.length / 2) || i === faturamentoPorDia.length - 1))) && (
                      <span className="text-[9px] text-muted leading-none">{dia.label}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3a: Status dos pedidos */}
      <div className="bg-surface border border-[#3d3d4d] rounded-2xl p-4 flex flex-col gap-3">
        <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Status dos pedidos</p>
        <div className="flex flex-col gap-2">
          {statusDist.map(({ status, count }) => (
            <div key={status} className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border w-20 text-center flex-shrink-0 ${STATUS_COLORS[status]}`}>
                {STATUS_LABELS[status]}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-[#2a2a3d] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    status === 'pendente'  ? 'bg-yellow-400' :
                    status === 'pago'      ? 'bg-blue-400' :
                    status === 'enviado'   ? 'bg-purple-400' :
                    status === 'entregue'  ? 'bg-green-400' :
                    'bg-red-400'
                  }`}
                  style={{ width: pedidos.length > 0 ? `${Math.round((count / pedidos.length) * 100)}%` : '0%' }}
                />
              </div>
              <span className="text-xs font-bold text-foreground w-4 text-right flex-shrink-0">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3b: Entregas vs Retiradas */}
      <div className="bg-surface border border-[#3d3d4d] rounded-2xl p-4 flex flex-col gap-3">
        <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Modalidade de entrega</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col items-center bg-background rounded-xl py-3 gap-0.5">
            <Truck size={18} className="text-primary mb-1" />
            <p className="text-2xl font-black text-foreground">{totalEntregas}</p>
            <p className="text-[10px] text-muted">Entregas</p>
          </div>
          <div className="flex flex-col items-center bg-background rounded-xl py-3 gap-0.5">
            <Store size={18} className="text-purple-400 mb-1" />
            <p className="text-2xl font-black text-foreground">{totalRetiradas}</p>
            <p className="text-[10px] text-muted">Retiradas</p>
          </div>
        </div>
        {/* Barra proporcional */}
        {totalVendas > 0 && (
          <div className="flex rounded-full overflow-hidden h-2 bg-[#2a2a3d]">
            <div
              className="bg-primary transition-all"
              style={{ width: `${Math.round((totalEntregas / totalVendas) * 100)}%` }}
            />
            <div
              className="bg-purple-500 transition-all"
              style={{ width: `${Math.round((totalRetiradas / totalVendas) * 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* 4: Marcas mais vendidas */}
      <div className="bg-surface border border-[#3d3d4d] rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Marcas mais vendidas</p>
          <button
            onClick={exportarCSV}
            disabled={concluidos.length === 0}
            className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Exportar CSV
          </button>
        </div>
        {marcasRank.length === 0 ? (
          <p className="text-xs text-muted">Sem dados ainda</p>
        ) : (
          <div className="flex flex-col gap-2">
            {marcasRank.slice(0, 8).map(([marca, qty], i) => (
              <div key={marca} className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted w-4 text-right">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold text-foreground">{marca}</span>
                    <span className="text-[10px] font-bold text-primary">{qty} un.</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#2a2a3d] overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.round((qty / maxMarca) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5: Disponibilidade do estoque */}
      <div className="bg-surface border border-[#3d3d4d] rounded-2xl p-4 flex flex-col gap-3">
        <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Disponibilidade de sabores</p>

        {/* Arco / barra grande */}
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0 w-20 h-20">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#2a2a3d" strokeWidth="3.5" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke="#a78bfa" strokeWidth="3.5"
                strokeDasharray={`${pctDisponivel} ${100 - pctDisponivel}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-black text-foreground leading-none">{pctDisponivel}%</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />
              <span className="text-foreground font-semibold">{comEstoque} disponíveis</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" />
              <span className="text-muted">{semEstoque} sem estoque</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400 flex-shrink-0" />
              <span className="text-muted">{criticos.length} críticos (&lt;5 un.)</span>
            </div>
          </div>
        </div>

        {/* 5.1: Pods críticos */}
        {criticos.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1">
            <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1">
              ⚠ Ultimas unidades disponíveis
            </p>
            {criticos.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-orange-400/5 border border-orange-400/20 rounded-xl px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{p.marca} · {p.sabor}</p>
                  <p className="text-[10px] text-muted">{p.tamanho}</p>
                </div>
                <span className="text-xs font-black text-orange-400 flex-shrink-0 ml-2">
                  {p.estoque} un.
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

// ── FotoUpload ────────────────────────────────────────────────
// Comprime a imagem no browser (max 700px, WebP 0.82) e salva como base64 no banco.
// Zero dependências externas, zero configuração.
function FotoUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Apenas imagens'); return; }
    setError('');
    setProcessing(true);

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 700;
        let { width, height } = img;
        if (width > height) {
          if (width > MAX) { height = Math.round((height * MAX) / width); width = MAX; }
        } else {
          if (height > MAX) { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        onChange(canvas.toDataURL('image/webp', 0.82));
        setProcessing(false);
      };
      img.onerror = () => { setError('Erro ao ler imagem'); setProcessing(false); };
      img.src = reader.result as string;
    };
    reader.onerror = () => { setError('Erro ao ler arquivo'); setProcessing(false); };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {value && (
          <img src={value} alt="preview" className="w-14 h-14 object-cover rounded-xl border border-[#3d3d4d] flex-shrink-0" />
        )}
        <label className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
          processing ? 'opacity-50 cursor-not-allowed border-[#3d3d4d] text-muted' : 'border-primary/40 text-primary hover:bg-primary/10'
        }`}>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={processing} />
          {processing ? 'Processando...' : value ? 'Trocar foto' : 'Adicionar foto'}
        </label>
        {value && (
          <button type="button" onClick={() => onChange('')} className="text-[10px] text-muted hover:text-red-400 transition-colors">
            Remover
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ── PromocoesTab ─────────────────────────────────────────────
interface Cupom {
  id: number;
  nome: string;
  codigo: string;
  valor: number;
  quantidade_total: number;
  quantidade_usada: number;
  ativo: boolean;
  criado_em: string;
}

const emptyFormCupom = { nome: '', codigo: '', valor: '', quantidade_total: '1' };

function PromocoesTab() {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyFormCupom);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  function fetchCupons() {
    setLoading(true);
    fetch('/api/admin/cupons')
      .then((r) => r.json())
      .then((d) => setCupons(d.cupons ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchCupons(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.nome || !form.codigo || !form.valor || !form.quantidade_total) {
      setFormError('Preencha todos os campos');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/cupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome,
          codigo: form.codigo.toUpperCase(),
          valor: Number(form.valor),
          quantidade_total: Number(form.quantidade_total),
        }),
      });
      if (!res.ok) { const d = await res.json(); setFormError(d.error ?? 'Erro ao criar'); return; }
      setForm(emptyFormCupom);
      fetchCupons();
    } catch { setFormError('Erro de conexao'); }
    finally { setSaving(false); }
  }

  async function toggleAtivo(c: Cupom) {
    await fetch(`/api/admin/cupons/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !c.ativo }),
    });
    fetchCupons();
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir este cupom?')) return;
    await fetch(`/api/admin/cupons/${id}`, { method: 'DELETE' });
    fetchCupons();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Formulário criar cupom */}
      <div className="bg-surface border border-[#3d3d4d] rounded-2xl p-5">
        <h2 className="text-sm font-bold text-foreground mb-4">Novo Cupom</h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted font-medium">Nome</label>
              <input value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                placeholder="Ex: Lançamento" className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted font-medium">Código</label>
              <input value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value.toUpperCase() }))}
                placeholder="Ex: PROMO10" className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary uppercase" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted font-medium">Valor (R$)</label>
              <input type="number" min="0.01" step="0.01" value={form.valor} onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))}
                placeholder="Ex: 10.00" className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted font-medium">Quantidade</label>
              <input type="number" min="1" step="1" value={form.quantidade_total} onChange={(e) => setForm((p) => ({ ...p, quantidade_total: e.target.value }))}
                className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
          </div>
          {formError && <p className="text-xs text-red-400">{formError}</p>}
          <button type="submit" disabled={saving}
            className="self-start flex items-center gap-2 bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-secondary disabled:opacity-40">
            <Plus size={16} /> {saving ? 'Criando...' : 'Criar Cupom'}
          </button>
        </form>
      </div>

      {/* Lista de cupons */}
      <div className="bg-surface border border-[#3d3d4d] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#3d3d4d]">
          <h2 className="text-sm font-bold text-foreground">Cupons cadastrados</h2>
        </div>
        {loading ? (
          <p className="text-sm text-muted px-5 py-6">Carregando...</p>
        ) : cupons.length === 0 ? (
          <p className="text-sm text-muted px-5 py-6">Nenhum cupom cadastrado.</p>
        ) : (
          <div className="divide-y divide-[#3d3d4d]">
            {cupons.map((c) => (
              <div key={c.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{c.codigo}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${c.ativo ? 'text-green-400 bg-green-400/10 border-green-400/30' : 'text-muted bg-surface border-[#3d3d4d]'}`}>
                      {c.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="text-xs text-muted truncate">{c.nome} · {formatPrice(Number(c.valor))} · {c.quantidade_usada}/{c.quantidade_total} usados</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleAtivo(c)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-[#3d3d4d] text-muted hover:text-foreground hover:border-primary transition-colors">
                    {c.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                  <button onClick={() => handleDelete(c.id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminClient({ produtos: initial }: Props) {
  const [tab, setTab] = useState<Tab>('estoque');

  // ── Vendas ───────────────────────────────────────────────────
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [statusTab, setStatusTab] = useState<StatusPedido>('pendente');
  const [modalidadeFiltro, setModalidadeFiltro] = useState<ModalidadeFiltro>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    if ((tab !== 'vendas' && tab !== 'faturamento') || pedidos.length > 0) return;
    setLoadingPedidos(true);
    fetch('/api/admin/pedidos')
      .then((r) => r.json())
      .then((d) => setPedidos(d.pedidos ?? []))
      .finally(() => setLoadingPedidos(false));
  }, [tab]);

  // Pedidos filtrados pela modalidade (base para contagens e lista final)
  const pedidosFiltradosMod = useMemo(() => {
    if (modalidadeFiltro === 'all') return pedidos;
    return pedidos.filter((p) => p.modalidade === modalidadeFiltro);
  }, [pedidos, modalidadeFiltro]);

  const pedidosPorStatus = useMemo(() => {
    const map: Record<StatusPedido, Pedido[]> = { pendente: [], pago: [], pagamento_recusado: [], enviado: [], entregue: [], cancelado: [] };
    for (const p of pedidosFiltradosMod) map[p.status].push(p);
    return map;
  }, [pedidosFiltradosMod]);

  // Lista final: modalidade + status, do mais antigo para o mais novo
  const pedidosAtivos = useMemo(() => {
    const lista = pedidosPorStatus[statusTab];
    return [...lista].sort((a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime());
  }, [pedidosPorStatus, statusTab]);

  async function updateStatus(id: number, novoStatus: StatusPedido) {
    setUpdatingId(id);
    await fetch(`/api/admin/pedidos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus }),
    });
    setPedidos((prev) => prev.map((p) => p.id === id ? { ...p, status: novoStatus } : p));
    setUpdatingId(null);
  }

  // ── Estoque ──────────────────────────────────────────────────
  const [produtos, setProdutos] = useState<Produto[]>(initial);
  const [filtroMarca, setFiltroMarca] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  // pendingStock: alteracoes locais ainda nao enviadas ao banco
  const [pendingStock, setPendingStock] = useState<Record<number, number>>({});
  // savingStock: IDs que estao sendo salvos agora
  const [savingStock, setSavingStock] = useState<Record<number, boolean>>({});
  // savedStock: IDs que acabaram de ser salvos (para mostrar check verde)
  const [savedStock, setSavedStock] = useState<Record<number, boolean>>({});
  // tamanhoPreco: edicoes de valor/custo por grupo (chave: `${marca}___${tamanho}`)
  const [tamanhoPreco, setTamanhoPreco] = useState<Record<string, { valor: string; custo: string }>>({});
  const [savingPreco, setSavingPreco] = useState<Record<string, boolean>>({});
  const [savedPreco, setSavedPreco] = useState<Record<string, boolean>>({});
  // togglingAtivo: grupos sendo ativados/desativados
  const [togglingAtivo, setTogglingAtivo] = useState<Record<string, boolean>>({});

  // Produtos agrupados por marca, cada marca com sabores em ordem alfabética
  const marcasAgrupadas = useMemo(() => {
    const lista = filtroMarca === 'all' ? produtos : produtos.filter((p) => p.marca === filtroMarca);
    const marcaMap = new Map<string, Map<string, Produto[]>>();
    for (const p of lista) {
      if (!marcaMap.has(p.marca)) marcaMap.set(p.marca, new Map());
      const tamanhoMap = marcaMap.get(p.marca)!;
      if (!tamanhoMap.has(p.tamanho)) tamanhoMap.set(p.tamanho, []);
      tamanhoMap.get(p.tamanho)!.push(p);
    }
    // Marcas A→Z, tamanhos A→Z, sabores A→Z
    return Array.from(marcaMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([marca, tamanhoMap]) => ({
        marca,
        tamanhos: Array.from(tamanhoMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([tamanho, prods]) => ({
            tamanho,
            produtos: [...prods].sort((a, b) => a.sabor.localeCompare(b.sabor)),
          })),
      }));
  }, [produtos, filtroMarca]);

  // ── Estoque helpers ──────────────────────────────────────────
  function onSliderChange(id: number, val: number) {
    setPendingStock((prev) => ({ ...prev, [id]: val }));
    setSavedStock((prev) => { const n = { ...prev }; delete n[id]; return n; });
  }

  async function confirmStock(id: number) {
    const val = pendingStock[id];
    if (val === undefined) return;
    setSavingStock((prev) => ({ ...prev, [id]: true }));
    await fetch(`/api/admin/catalogo/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estoque: val }),
    });
    setProdutos((prev) => prev.map((p) => p.id === id ? { ...p, estoque: val } : p));
    setPendingStock((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setSavingStock((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setSavedStock((prev) => ({ ...prev, [id]: true }));
    // limpa o check apos 2s
    setTimeout(() => setSavedStock((prev) => { const n = { ...prev }; delete n[id]; return n; }), 2000);
  }

  async function savePreco(marca: string, tamanho: string, prods: Produto[]) {
    const key = `${marca}___${tamanho}`;
    const precoData = tamanhoPreco[key];
    if (!precoData) return;
    const valor = Number(precoData.valor);
    const custo = Number(precoData.custo || '0');
    if (isNaN(valor) || valor <= 0) return;
    setSavingPreco((prev) => ({ ...prev, [key]: true }));
    await Promise.all(prods.map((p) =>
      fetch(`/api/admin/catalogo/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor, custo }),
      })
    ));
    setProdutos((prev) => prev.map((x) =>
      prods.some((p) => p.id === x.id) ? { ...x, valor, custo } : x
    ));
    setTamanhoPreco((prev) => { const n = { ...prev }; delete n[key]; return n; });
    setSavingPreco((prev) => { const n = { ...prev }; delete n[key]; return n; });
    setSavedPreco((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setSavedPreco((prev) => { const n = { ...prev }; delete n[key]; return n; }), 2000);
  }

  async function toggleTamanhoAtivo(marca: string, tamanho: string, prods: Produto[]) {
    const key = `${marca}___${tamanho}`;
    const novoAtivo = !prods.some((p) => p.ativo);
    setTogglingAtivo((prev) => ({ ...prev, [key]: true }));
    await Promise.all(prods.map((p) =>
      fetch(`/api/admin/catalogo/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: novoAtivo }),
      })
    ));
    setProdutos((prev) => prev.map((x) =>
      prods.some((p) => p.id === x.id) ? { ...x, ativo: novoAtivo ? 1 : 0 } : x
    ));
    setTogglingAtivo((prev) => { const n = { ...prev }; delete n[key]; return n; });
  }

  // ── Deletar produto ──────────────────────────────────────────
  async function handleDelete(id: number) {
    if (!confirm('Desativar este produto?')) return;
    setDeletingId(id);
    await fetch(`/api/admin/catalogo/${id}`, { method: 'DELETE' });
    setProdutos((prev) => prev.filter((p) => p.id !== id));
    setDeletingId(null);
  }

  // ── Criar produto ────────────────────────────────────────────
  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/catalogo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          valor: Number(form.valor),
          custo: Number(form.custo ?? 0),
          estoque: Number(form.estoque),
          foto_url: form.foto_url || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Erro ao criar'); return; }
      setProdutos((prev) => [...prev, {
        id: data.id,
        marca: form.marca,
        sabor: form.sabor,
        descricao: form.descricao || null,
        tamanho: form.tamanho,
        valor: Number(form.valor),
        custo: Number(form.custo ?? 0),
        estoque: Number(form.estoque),
        emoji: form.emoji || null,
        ativo: 1,
        novo: false,
        foto_url: form.foto_url || null,
      }]);
      setForm(emptyForm);
      setShowForm(false);
    } catch {
      setFormError('Erro de conexao');
    } finally {
      setSaving(false);
    }
  }

  // ── Editar produto ───────────────────────────────────────────
  function startEdit(p: Produto) {
    setEditingId(p.id);
    setEditForm({
      marca: p.marca,
      sabor: p.sabor,
      descricao: p.descricao ?? '',
      tamanho: p.tamanho,
      valor: String(p.valor),
      custo: String(p.custo ?? ''),
      estoque: String(p.estoque),
      emoji: p.emoji ?? '',
      foto_url: p.foto_url ?? '',
    });
    setEditError('');
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setEditError('');
    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/catalogo/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          valor: Number(editForm.valor),
          custo: Number(editForm.custo ?? 0),
          estoque: Number(editForm.estoque),
          foto_url: editForm.foto_url || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error || 'Erro ao salvar'); return; }
      setProdutos((prev) => prev.map((p) =>
        p.id === editingId
          ? { ...p, marca: editForm.marca, sabor: editForm.sabor, descricao: editForm.descricao || null,
              tamanho: editForm.tamanho, valor: Number(editForm.valor), custo: Number(editForm.custo ?? 0),
              estoque: Number(editForm.estoque), emoji: editForm.emoji || null, foto_url: editForm.foto_url || null }
          : p
      ));
      setEditingId(null);
    } catch {
      setEditError('Erro de conexao');
    } finally {
      setEditSaving(false);
    }
  }

  // ── Tabs ─────────────────────────────────────────────────────
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'vendas',        label: 'Vendas',        icon: <ShoppingBag size={16} /> },
    { key: 'estoque',       label: 'Estoque',       icon: <PackageSearch size={16} /> },
    { key: 'faturamento',   label: 'Faturamento',   icon: <TrendingUp size={16} /> },
    { key: 'investimentos', label: 'Investimentos', icon: <span className="text-sm">💰</span> },
    { key: 'promocoes',     label: 'Promoções',     icon: <Tag size={16} /> },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ── Mobile header ── */}
      <header className="md:hidden sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-[#3d3d4d] py-4 px-4 flex items-center gap-3">
        <Link href="/" className="w-9 h-9 rounded-xl bg-surface border border-[#3d3d4d] flex items-center justify-center hover:border-primary active:scale-95">
          <ArrowLeft size={18} className="text-foreground" />
        </Link>
        <div>
          <h1 className="text-base font-bold text-foreground">Painel Admin</h1>
          <p className="text-xs text-muted">{produtos.length} produtos cadastrados</p>
        </div>
      </header>

      {/* ── Mobile tab bar ── */}
      <div className="md:hidden border-b border-[#3d3d4d] bg-surface flex">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold border-b-2 transition-all ${
              tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Body: sidebar (desktop) + content ── */}
      <div className="flex flex-1">
        {/* Sidebar — desktop only */}
        <aside className="hidden md:flex sticky top-14 self-start h-[calc(100vh-56px)] w-56 shrink-0 border-r border-[#3d3d4d] bg-surface flex-col">
          <div className="px-5 py-5 border-b border-[#3d3d4d]">
            <Link href="/" className="flex items-center gap-2 text-muted hover:text-primary text-xs font-semibold mb-4">
              <ArrowLeft size={14} /> Voltar à loja
            </Link>
            <p className="text-base font-black text-foreground">Painel Admin</p>
            <p className="text-xs text-muted mt-0.5">{produtos.length} produtos</p>
          </div>
          <nav className="flex flex-col gap-1 p-3 flex-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all ${
                  tab === t.key
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted hover:bg-primary/5 hover:text-foreground'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content — shared mobile + desktop */}
        <main className="flex-1 min-w-0 px-4 md:px-8 pt-4 md:pt-6 pb-10">

        {/* ── VENDAS ── */}
        {tab === 'vendas' && (
          <div className="flex flex-col gap-4">

            {/* Filtros: modalidade + status (independentes) */}
            <div className="flex flex-col gap-1.5">
              {/* Linha 1: Todas / Entregas / Retiradas */}
              <div className="flex gap-1.5">
                {([
                  { key: 'all',      label: 'Todos',     count: pedidos.length },
                  { key: 'entrega',  label: 'Entregas',  count: pedidos.filter((p) => p.modalidade === 'entrega').length },
                  { key: 'retirada', label: 'Retiradas', count: pedidos.filter((p) => p.modalidade === 'retirada').length },
                ] as const).map(({ key, label, count }) => {
                  const isActive = modalidadeFiltro === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setModalidadeFiltro(key)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-primary/10 text-primary border-primary'
                          : 'bg-surface text-muted border-[#3d3d4d] hover:border-primary/40'
                      }`}
                    >
                      {label}
                      {count > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#2a2a3d]">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Linha 2: Status — contagens refletem o filtro de modalidade acima */}
              <div className="flex overflow-x-auto no-scrollbar gap-1.5 pb-0.5">
                {STATUS_SEQUENCE.map((s) => {
                  const count = pedidosPorStatus[s].length;
                  const isActive = statusTab === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setStatusTab(s)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        isActive
                          ? STATUS_COLORS[s] + ' border-current'
                          : 'bg-surface text-muted border-[#3d3d4d] hover:border-primary/40'
                      }`}
                    >
                      {STATUS_LABELS[s]}
                      {count > 0 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          isActive ? 'bg-current/20' : 'bg-[#2a2a3d]'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Loading */}
            {loadingPedidos && (
              <div className="flex justify-center py-16">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Lista de pedidos */}
            {!loadingPedidos && pedidosAtivos.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <ShoppingBag size={40} className="text-muted opacity-30" />
                <p className="text-sm text-muted">Nenhum pedido encontrado</p>
              </div>
            )}

            {!loadingPedidos && pedidosAtivos.map((pedido) => {
              const isUpdating = updatingId === pedido.id;
              const dt = new Date(pedido.criado_em);
              const hora = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              const data = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
              const waNum = pedido.telefone ? pedido.telefone.replace(/\D/g, '') : null;
              const waLink = waNum
                ? `https://wa.me/55${waNum}`
                : null;

              return (
                <div key={pedido.id} className="bg-surface border border-[#3d3d4d] rounded-2xl overflow-hidden">

                  {/* ── Cabeçalho: #ID · nome · hora · data ── */}
                  <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-[11px] font-black text-muted">#{pedido.id}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${STATUS_COLORS[pedido.status]}`}>
                          {STATUS_LABELS[pedido.status]}
                        </span>
                        <span className="text-[10px] text-muted bg-[#2a2a3d] px-2 py-0.5 rounded-lg">
                          {pedido.modalidade === 'retirada' ? 'Retirada' : 'Entrega'}
                        </span>
                        {pedido.metodo_pagamento && (
                          <span className="text-[10px] text-muted bg-[#2a2a3d] px-2 py-0.5 rounded-lg">
                            {METODO_LABELS[pedido.metodo_pagamento] ?? pedido.metodo_pagamento}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-foreground leading-tight truncate">
                        {pedido.nome_completo || pedido.username}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-black text-primary leading-none">{hora}</p>
                      <p className="text-[11px] text-muted mt-0.5">{data}</p>
                    </div>
                  </div>

                  {/* ── Itens ── */}
                  <div className="px-4 py-2 border-t border-[#3d3d4d] flex flex-col gap-1">
                    {pedido.itens.map((item, i) => (
                      <div key={i} className="flex items-baseline justify-between gap-2">
                        <p className="text-xs text-foreground">
                          <span className="font-black text-primary">{item.quantidade}x</span>
                          {' '}{item.nome_produto} {item.tamanho}
                          <span className="text-muted"> · {item.sabor}</span>
                        </p>
                        <span className="text-[11px] text-muted flex-shrink-0">{formatPrice(item.valor_unitario)}</span>
                      </div>
                    ))}
                    {(pedido.desconto > 0 || pedido.valor_frete > 0) && (
                      <div className="flex items-center gap-3 mt-1 pt-1 border-t border-[#3d3d4d]">
                        {pedido.desconto > 0 && (
                          <span className="text-[10px] text-green-400 font-semibold">-{formatPrice(pedido.desconto)}</span>
                        )}
                        {pedido.valor_frete > 0 && (
                          <span className="text-[10px] text-muted">frete {formatPrice(pedido.valor_frete)}</span>
                        )}
                        <span className="ml-auto text-xs font-black text-primary">{formatPrice(pedido.valor_total)}</span>
                      </div>
                    )}
                    {pedido.desconto === 0 && pedido.valor_frete === 0 && (
                      <div className="flex justify-end mt-0.5">
                        <span className="text-xs font-black text-primary">{formatPrice(pedido.valor_total)}</span>
                      </div>
                    )}
                  </div>

                  {/* ── Endereço / Retirada ── */}
                  <div className="px-4 py-2 border-t border-[#3d3d4d] flex items-start gap-1.5">
                    <MapPin size={11} className="text-muted flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      {pedido.modalidade === 'retirada' ? (
                        <p className="text-xs text-foreground">
                          Retirada — <span className="font-bold text-primary">{pedido.horario_retirada}</span>
                        </p>
                      ) : pedido.end_logradouro ? (
                        <>
                          <p className="text-xs text-foreground">
                            {pedido.end_logradouro}, {pedido.end_numero}
                            {pedido.end_complemento ? ` / ${pedido.end_complemento}` : ''}
                            {pedido.end_apelido ? ` (${pedido.end_apelido})` : ''}
                          </p>
                          <p className="text-[10px] text-muted">
                            {pedido.end_bairro} · {pedido.end_cidade}/{pedido.end_estado} · {pedido.end_cep}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-muted">Endereco nao informado</p>
                      )}
                    </div>
                  </div>

                  {/* ── OBS ── */}
                  {pedido.obs && (
                    <div className="px-4 py-2 border-t border-[#3d3d4d] flex items-start gap-1.5">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wider flex-shrink-0 mt-0.5">OBS</span>
                      <p className="text-xs text-foreground">{pedido.obs}</p>
                    </div>
                  )}

                  {/* ── Rodapé: WhatsApp + alterar status ── */}
                  <div className="px-4 py-2 border-t border-[#3d3d4d] flex items-center gap-2 flex-wrap">
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        WhatsApp
                      </a>
                    )}
                    <div className="flex gap-1.5 flex-wrap">
                      {STATUS_SEQUENCE.filter((s) => s !== pedido.status).map((s) => (
                        <button
                          key={s}
                          onClick={() => updateStatus(pedido.id, s)}
                          disabled={isUpdating}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border transition-all disabled:opacity-40 ${STATUS_COLORS[s]}`}
                        >
                          {isUpdating ? '...' : STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* ── ESTOQUE ── */}
        {tab === 'estoque' && (
          <div className="flex flex-col gap-4">

            {/* Botão novo produto */}
            <button
              onClick={() => setShowForm((v) => !v)}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-2xl py-3 text-sm font-bold active:scale-[0.98]"
            >
              <Plus size={18} />
              {showForm ? 'Cancelar' : 'Novo Produto'}
            </button>

            {/* Formulário novo produto */}
            {showForm && (
              <form onSubmit={handleCreate} className="bg-surface border border-[#3d3d4d] rounded-2xl p-4 flex flex-col gap-3">
                <h2 className="text-sm font-bold text-foreground">Cadastrar produto</h2>
                <div className="grid grid-cols-2 gap-2">
                  <input required placeholder="Marca" value={form.marca}
                    onChange={(e) => setForm((p) => ({ ...p, marca: e.target.value }))}
                    className="col-span-2 bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary" />
                  <input required placeholder="Sabor" value={form.sabor}
                    onChange={(e) => setForm((p) => ({ ...p, sabor: e.target.value }))}
                    className="col-span-2 bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary" />
                  <input placeholder="Descricao" value={form.descricao}
                    onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
                    className="col-span-2 bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary" />
                  <input required placeholder="Tamanho (ex: 30K)" value={form.tamanho}
                    onChange={(e) => setForm((p) => ({ ...p, tamanho: e.target.value }))}
                    className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary" />
                  <input placeholder="Emoji" value={form.emoji}
                    onChange={(e) => setForm((p) => ({ ...p, emoji: e.target.value }))}
                    className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary" />
                  <input required type="number" min="0" step="0.01" placeholder="Valor (R$)" value={form.valor}
                    onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))}
                    className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary" />
                  <input type="number" min="0" step="0.01" placeholder="Custo (R$)" value={form.custo}
                    onChange={(e) => setForm((p) => ({ ...p, custo: e.target.value }))}
                    className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary" />
                  <input required type="number" min="0" placeholder="Estoque" value={form.estoque}
                    onChange={(e) => setForm((p) => ({ ...p, estoque: e.target.value }))}
                    className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary" />
                </div>
                <FotoUpload value={form.foto_url} onChange={(url) => setForm((p) => ({ ...p, foto_url: url }))} />
                {formError && <p className="text-xs text-red-400">{formError}</p>}
                <button type="submit" disabled={saving}
                  className="w-full bg-primary text-white rounded-xl py-2.5 text-sm font-bold disabled:opacity-50">
                  {saving ? 'Salvando...' : 'Cadastrar'}
                </button>
              </form>
            )}

            {/* Filtro por marca */}
            <div className="overflow-x-auto no-scrollbar">
              <div className="flex gap-1.5 w-max">
                {(['all', ...Array.from(new Set(produtos.map((p) => p.marca))).sort()]).map((m) => (
                  <button key={m} onClick={() => setFiltroMarca(m)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl border whitespace-nowrap transition-all ${
                      filtroMarca === m ? 'bg-primary text-white border-primary' : 'bg-surface text-muted border-[#3d3d4d] hover:border-primary/50'
                    }`}>
                    {m === 'all' ? 'Todas' : m}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista agrupada por marca → tamanho → sabor */}
            <div className="flex flex-col gap-4">
              {marcasAgrupadas.map(({ marca, tamanhos }) => {
                const totalSaboresMarca = tamanhos.reduce((acc, t) => acc + t.produtos.length, 0);
                return (
                  <div key={marca} className="bg-surface border border-[#3d3d4d] rounded-2xl p-4 flex flex-col gap-3">

                    {/* Cabeçalho da marca */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">{marca}</span>
                      <span className="text-[10px] text-muted font-semibold bg-[#2a2a3d] px-2 py-0.5 rounded-lg">
                        {totalSaboresMarca} sabor{totalSaboresMarca !== 1 ? 'es' : ''}
                      </span>
                    </div>

                    {/* Grupos por tamanho */}
                    <div className="flex flex-col gap-3">
                      {tamanhos.map(({ tamanho, produtos: prods }) => {
                          const grupoKey = `${marca}___${tamanho}`;
                          const grupoAtivo = prods.some((p) => p.ativo);
                          const isToggling = togglingAtivo[grupoKey];
                          return (
                        <div key={tamanho} className={`bg-background border rounded-xl p-3 flex flex-col gap-2 transition-opacity ${grupoAtivo ? 'border-[#3d3d4d]' : 'border-red-400/20 opacity-50'}`}>

                          {/* Cabeçalho do tamanho */}
                          <div className="flex flex-col gap-2 pb-2 border-b border-[#3d3d4d]">
                            {/* Linha 1: nome, contagem, toggle ativo, NOVO */}
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold ${grupoAtivo ? 'text-foreground' : 'text-muted line-through'}`}>{tamanho}</span>
                              <span className="text-[10px] text-muted">{prods.length} sabor{prods.length !== 1 ? 'es' : ''}</span>
                              <button
                                onClick={() => toggleTamanhoAtivo(marca, tamanho, prods)}
                                disabled={isToggling}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-colors disabled:opacity-40 ${
                                  grupoAtivo
                                    ? 'text-red-400 border-red-400/30 hover:bg-red-400/10'
                                    : 'text-green-400 border-green-400/30 hover:bg-green-400/10'
                                }`}
                              >
                                {isToggling ? '...' : grupoAtivo ? 'Desativar' : 'Ativar'}
                              </button>
                              <label className="flex items-center gap-1 cursor-pointer ml-auto">
                                <input
                                  type="checkbox"
                                  checked={prods.some((p) => p.novo)}
                                  onChange={async (e) => {
                                    const novoVal = e.target.checked;
                                    setProdutos((prev) => prev.map((x) =>
                                      prods.some((p) => p.id === x.id) ? { ...x, novo: novoVal } : x
                                    ));
                                    await Promise.all(prods.map((p) =>
                                      fetch(`/api/admin/catalogo/${p.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ novo: novoVal }),
                                      })
                                    ));
                                  }}
                                  className="w-3.5 h-3.5 accent-orange-400 cursor-pointer"
                                />
                                <span className="text-[10px] font-extrabold text-orange-400">NOVO</span>
                              </label>
                            </div>
                            {/* Linha 2: valor/custo por tamanho (aplica a todos os sabores) */}
                            {(() => {
                              const key = `${marca}___${tamanho}`;
                              const rep = prods[0];
                              const editData = tamanhoPreco[key];
                              const currentValor = editData?.valor ?? String(rep.valor);
                              const currentCusto = editData?.custo ?? String(rep.custo ?? '0');
                              const isDirty = editData !== undefined;
                              const isSaving = savingPreco[key];
                              const isSaved = savedPreco[key];
                              return (
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-muted font-medium">R$</span>
                                    <input
                                      type="number" min="0" step="0.01"
                                      value={currentValor}
                                      onChange={(e) => setTamanhoPreco((prev) => ({
                                        ...prev,
                                        [key]: { valor: e.target.value, custo: prev[key]?.custo ?? String(rep.custo ?? '0') },
                                      }))}
                                      className="w-20 bg-[#2a2a3d] border border-[#3d3d4d] rounded-lg px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                                      placeholder="Valor"
                                    />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-muted font-medium">custo</span>
                                    <input
                                      type="number" min="0" step="0.01"
                                      value={currentCusto}
                                      onChange={(e) => setTamanhoPreco((prev) => ({
                                        ...prev,
                                        [key]: { valor: prev[key]?.valor ?? String(rep.valor), custo: e.target.value },
                                      }))}
                                      className="w-20 bg-[#2a2a3d] border border-[#3d3d4d] rounded-lg px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                                      placeholder="Custo"
                                    />
                                  </div>
                                  {isSaved ? (
                                    <span className="flex items-center gap-0.5 text-green-400 text-[10px] font-bold ml-auto">
                                      <Check size={11} /> Salvo
                                    </span>
                                  ) : isDirty ? (
                                    <button
                                      onClick={() => savePreco(marca, tamanho, prods)}
                                      disabled={isSaving}
                                      className="ml-auto flex items-center gap-0.5 text-[10px] font-bold px-2 py-1 rounded-lg bg-primary text-white hover:bg-secondary disabled:opacity-50 transition-colors"
                                    >
                                      {isSaving ? '...' : <><Check size={11} /> Salvar</>}
                                    </button>
                                  ) : null}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Sabores deste tamanho */}
                          <div className="flex flex-col gap-3">
                            {prods.map((p: Produto) => (
                              <div key={p.id} className="flex flex-col">
                                <div className="flex flex-col gap-0.5 px-1 pt-2 pb-1">
                                  {/* Linha: foto + nome + ações */}
                                  <div className="flex items-center gap-2">
                                    {p.foto_url && (
                                      <img src={p.foto_url} alt={p.sabor} className="w-10 h-10 object-cover rounded-lg flex-shrink-0 border border-[#3d3d4d]" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <p className="text-base font-semibold text-foreground truncate leading-tight">{p.sabor}</p>
                                        {p.emoji && <span className="text-base">{p.emoji}</span>}
                                      </div>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                      <button onClick={() => editingId === p.id ? setEditingId(null) : startEdit(p)}
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center active:scale-95 transition-all ${
                                          editingId === p.id ? 'bg-primary/20 text-primary' : 'text-muted hover:text-primary hover:bg-primary/10'
                                        }`}>
                                        {editingId === p.id ? <X size={14} /> : <Pencil size={14} />}
                                      </button>
                                      <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-red-400 hover:bg-red-400/10 active:scale-95 transition-all">
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Barra de estoque */}
                                  {(() => {
                                    const displayVal = pendingStock[p.id] ?? p.estoque;
                                    const isDirty = pendingStock[p.id] !== undefined;
                                    const isSaved = savedStock[p.id];
                                    const pct = Math.round((displayVal / 60) * 100);
                                    return (
                                      <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-3">
                                          <div className="flex-1 flex flex-col items-center gap-1">
                                            <span className={`text-2xl font-bold leading-none ${
                                              displayVal === 0 ? 'text-red-400' : displayVal <= 5 ? 'text-orange-400' : isDirty ? 'text-primary' : 'text-green-400'
                                            }`}>{displayVal}</span>
                                            <input
                                              type="range" min={0} max={60} value={displayVal}
                                              onChange={(e) => onSliderChange(p.id, Number(e.target.value))}
                                              style={{ background: `linear-gradient(to right, #ef4444, #22c55e ${pct}%, #2a2a3d ${pct}%)` }}
                                              className="w-full h-1 rounded-full cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0"
                                            />
                                          </div>
                                          {isSaved ? (
                                            <div className="h-6 px-2 rounded flex items-center gap-0.5 bg-green-500/20 text-green-400 text-xs font-bold flex-shrink-0">
                                              <Check size={11} /> OK
                                            </div>
                                          ) : isDirty ? (
                                            <button onClick={() => confirmStock(p.id)} disabled={savingStock[p.id]}
                                              className="h-6 px-2 rounded flex items-center gap-0.5 bg-primary text-white text-xs font-bold hover:bg-primary/80 active:scale-95 transition-all flex-shrink-0">
                                              {savingStock[p.id] ? '...' : <><Check size={11} /> OK</>}
                                            </button>
                                          ) : null}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* Formulário de edição inline */}
                                {editingId === p.id && (
                                  <form onSubmit={handleUpdate} className="bg-surface border border-primary/40 rounded-xl mt-1 p-3 flex flex-col gap-3">
                                    <p className="text-xs font-bold text-primary">Editar produto</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      <input required placeholder="Marca" value={editForm.marca}
                                        onChange={(e) => setEditForm((f) => ({ ...f, marca: e.target.value }))}
                                        className="col-span-2 bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary" />
                                      <input required placeholder="Sabor" value={editForm.sabor}
                                        onChange={(e) => setEditForm((f) => ({ ...f, sabor: e.target.value }))}
                                        className="col-span-2 bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary" />
                                      <input placeholder="Descricao" value={editForm.descricao}
                                        onChange={(e) => setEditForm((f) => ({ ...f, descricao: e.target.value }))}
                                        className="col-span-2 bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary" />
                                      <input required placeholder="Tamanho" value={editForm.tamanho}
                                        onChange={(e) => setEditForm((f) => ({ ...f, tamanho: e.target.value }))}
                                        className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary" />
                                      <input placeholder="Emoji" value={editForm.emoji}
                                        onChange={(e) => setEditForm((f) => ({ ...f, emoji: e.target.value }))}
                                        className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary" />
                                      <input required type="number" min="0" step="0.01" placeholder="Valor (R$)" value={editForm.valor}
                                        onChange={(e) => setEditForm((f) => ({ ...f, valor: e.target.value }))}
                                        className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary" />
                                      <input type="number" min="0" step="0.01" placeholder="Custo (R$)" value={editForm.custo}
                                        onChange={(e) => setEditForm((f) => ({ ...f, custo: e.target.value }))}
                                        className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary" />
                                      <input required type="number" min="0" placeholder="Estoque" value={editForm.estoque}
                                        onChange={(e) => setEditForm((f) => ({ ...f, estoque: e.target.value }))}
                                        className="bg-background border border-[#3d3d4d] rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary" />
                                    </div>
                                    <FotoUpload value={editForm.foto_url} onChange={(url) => setEditForm((f) => ({ ...f, foto_url: url }))} />
                                    {editError && <p className="text-xs text-red-400">{editError}</p>}
                                    <div className="flex gap-2">
                                      <button type="button" onClick={() => setEditingId(null)}
                                        className="flex-1 border border-[#3d3d4d] text-muted rounded-xl py-2 text-sm font-semibold">
                                        Cancelar
                                      </button>
                                      <button type="submit" disabled={editSaving}
                                        className="flex-1 bg-primary text-white rounded-xl py-2 text-sm font-bold disabled:opacity-50">
                                        {editSaving ? 'Salvando...' : 'Salvar'}
                                      </button>
                                    </div>
                                  </form>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── FATURAMENTO ── */}
        {tab === 'faturamento' && <FaturamentoTab pedidos={pedidos} produtos={produtos} />}

        {/* ── INVESTIMENTOS ── */}
        {tab === 'investimentos' && <InvestimentosTab />}

        {/* ── PROMOÇÕES ── */}
        {tab === 'promocoes' && <PromocoesTab />}

        </main>
      </div>{/* /body flex */}
    </div>
  );
}
