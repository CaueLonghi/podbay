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

export interface CartCupom {
  codigo: string;
  valor: number;
  nome: string;
}

interface CartContextValue {
  items: CartItem[];
  cupom: CartCupom | null;
  addToCart: (produto: Produto) => void;
  changeQty: (id: string, delta: number) => void;
  finishOrder: () => void;
  clearCart: () => void;
  setCupom: (c: CartCupom | null) => void;
  totalQty: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  cupom: null,
  addToCart: () => {},
  changeQty: () => {},
  finishOrder: () => {},
  clearCart: () => {},
  setCupom: () => {},
  totalQty: 0,
  totalPrice: 0,
});

const STORAGE_KEY = 'podbay_cart';
const CUPOM_KEY = 'podbay_cupom';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cupom, setCupomState] = useState<CartCupom | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch { /* ignore */ }
    try {
      const storedCupom = localStorage.getItem(CUPOM_KEY);
      if (storedCupom) setCupomState(JSON.parse(storedCupom));
    } catch { /* ignore */ }
  }, []);

  // Persist items to localStorage on change
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
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const setCupom = useCallback((c: CartCupom | null) => {
    setCupomState(c);
    if (c) {
      localStorage.setItem(CUPOM_KEY, JSON.stringify(c));
    } else {
      localStorage.removeItem(CUPOM_KEY);
    }
  }, []);

  const finishOrder = useCallback(() => {
    setItems([]);
    setCupomState(null);
    localStorage.removeItem(CUPOM_KEY);
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCupomState(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CUPOM_KEY);
  }, []);

  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, cupom, addToCart, changeQty, finishOrder, clearCart, setCupom, totalQty, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
