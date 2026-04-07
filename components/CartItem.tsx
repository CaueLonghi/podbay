'use client';

import { memo } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem as CartItemType } from '@/context/CartContext';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';

interface CartItemProps {
  item: CartItemType;
}

export default memo(function CartItem({ item }: CartItemProps) {
  const { changeQty } = useCart();

  return (
    <div className="bg-surface border border-[#3d3d4d] rounded-2xl p-4 flex items-center gap-3">
      {/* Emoji */}
      <div className="bg-background rounded-xl w-12 h-12 flex items-center justify-center text-2xl flex-shrink-0">
        {item.emoji}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{item.product_name}</p>
        <p className="text-sm text-primary font-medium mt-0.5">
          {formatPrice(item.price)}
        </p>
      </div>

      {/* Qty controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => changeQty(item.id, -1)}
          className="w-7 h-7 rounded-lg border border-[#3d3d4d] flex items-center justify-center text-muted hover:border-primary hover:text-primary active:scale-95"
          aria-label="Diminuir quantidade"
        >
          {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
        </button>
        <span className="text-sm font-bold text-foreground w-5 text-center">
          {item.quantity}
        </span>
        <button
          onClick={() => changeQty(item.id, 1)}
          className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white hover:bg-secondary active:scale-95"
          aria-label="Aumentar quantidade"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
});
