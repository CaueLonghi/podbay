'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';

const navItems = [
  { label: 'Início', href: '/', icon: Home },
  { label: 'Carrinho', href: '/cart', icon: ShoppingBag },
  { label: 'Perfil', href: '/profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { totalQty } = useCart();

  return (
    <nav className="md:hidden fixed bottom-0 left-1/2 w-full max-w-mobile border-t border-[#3d3d4d] bg-[#1f1f2e] z-40"
      style={{ transform: 'translateX(-50%)' }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;
          const color = isActive ? '#a78bfa' : '#6b7280';

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 flex-1 py-2 relative"
            >
              <div className="relative">
                <Icon size={22} color={color} strokeWidth={isActive ? 2.5 : 2} />
                {label === 'Carrinho' && totalQty > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                    {totalQty > 99 ? '99+' : totalQty}
                  </span>
                )}
              </div>
              <span
                className="text-[10px] font-medium"
                style={{ color }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
