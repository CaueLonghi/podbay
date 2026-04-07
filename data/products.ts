export interface Product {
  id: string;
  name: string;
  cat: 'pods' | 'bateria' | 'liquido' | 'acessorio';
  price: number;
  emoji: string;
  rating: number;
}

export const products: Product[] = [
  { id: 'p1', name: 'Pod Mint Fresco', cat: 'pods', price: 28.90, emoji: '❄️', rating: 4.8 },
  { id: 'p2', name: 'Pod Berry Suave', cat: 'pods', price: 31.90, emoji: '🫐', rating: 4.6 },
  { id: 'b1', name: 'Bateria Ultra', cat: 'bateria', price: 89.90, emoji: '⚡', rating: 4.9 },
  { id: 'b2', name: 'Bateria Turbo', cat: 'bateria', price: 99.90, emoji: '🔋', rating: 4.7 },
  { id: 'l1', name: 'Líquido Tropical', cat: 'liquido', price: 42.90, emoji: '🌴', rating: 4.5 },
  { id: 'l2', name: 'Líquido Morango', cat: 'liquido', price: 39.90, emoji: '🍓', rating: 4.8 },
  { id: 'a1', name: 'Case Protetor', cat: 'acessorio', price: 24.90, emoji: '📱', rating: 4.9 },
  { id: 'a2', name: 'Carregador USB-C', cat: 'acessorio', price: 34.90, emoji: '🔌', rating: 4.7 },
];
