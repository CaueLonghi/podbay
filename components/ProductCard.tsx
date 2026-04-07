'use client';

import { memo } from 'react';
import { Plus } from 'lucide-react';
import { Produto } from '@/lib/catalogo';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { formatPrice } from '@/lib/utils';

interface ProductCardProps {
  produto: Produto;
}

export default memo(function ProductCard({ produto }: ProductCardProps) {
  const { addToCart } = useCart();
  const { showToast } = useToast();

  function handleAdd() {
    addToCart(produto);
    showToast(`${produto.marca} ${produto.sabor} adicionado! 🛒`);
  }

  return (
    <div className="bg-surface border border-[#3d3d4d] rounded-2xl p-4 flex flex-col gap-3">
      {/* Emoji */}
      <div className="bg-[#0f0f1e] rounded-xl h-24 flex items-center justify-center text-4xl select-none">
        {produto.emoji ?? '📦'}
      </div>

      {/* Marca + Tamanho badge */}
      <div className="flex items-center gap-1.5">
        <span className="bg-primary text-white text-[11px] font-bold px-2 py-0.5 rounded-md leading-tight">
          {produto.marca}
        </span>
        <span className="bg-[#2a2a3d] text-muted text-[11px] font-semibold px-2 py-0.5 rounded-md leading-tight truncate">
          {produto.tamanho}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
          {produto.sabor}
        </h3>
        <span className="text-xs text-muted">
          Estoque: {produto.estoque}
        </span>
      </div>

      {/* Price + Add */}
      <div className="flex items-center justify-between mt-auto">
        <span className="text-base font-bold text-foreground">
          {formatPrice(Number(produto.valor))}
        </span>
        <button
          onClick={handleAdd}
          disabled={produto.estoque === 0}
          className="bg-primary hover:bg-secondary text-white rounded-xl w-8 h-8 flex items-center justify-center flex-shrink-0 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={`Adicionar ${produto.sabor} ao carrinho`}
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
});
