'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Produto } from '@/lib/catalogo';

export interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  marca: string;
  tamanho: string;
  sabor: string;
  quantity: number;
  price: number;
  emoji: string;
}

interface CartContextValue {
  items: CartItem[];
  addToCart: (produto: Produto) => void;
  changeQty: (id: string, delta: number) => void;
  finishOrder: () => void;
  clearCart: () => void;
  totalQty: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  addToCart: () => {},
  changeQty: () => {},
  finishOrder: () => {},
  clearCart: () => {},
  totalQty: 0,
  totalPrice: 0,
});

const STORAGE_KEY = 'podbay_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = useCallback((produto: Produto) => {
    const pid = String(produto.id);
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === pid);
      if (existing) {
        return prev.map((i) =>
          i.product_id === pid ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      const newItem: CartItem = {
        id: `${pid}-${Date.now()}`,
        product_id: pid,
        product_name: `${produto.marca} ${produto.sabor}`,
        marca: produto.marca,
        tamanho: produto.tamanho,
        sabor: produto.sabor,
        quantity: 1,
        price: Number(produto.valor),
        emoji: produto.emoji ?? '📦',
      };
      return [...prev, newItem];
    });
  }, []);

  const changeQty = useCallback((id: string, delta: number) => {
    setItems((prev) => {
      return prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0);
    });
  }, []);

  const finishOrder = useCallback(() => {
    setItems([]);
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, changeQty, finishOrder, clearCart, totalQty, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
