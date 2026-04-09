'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, User, ShieldCheck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function TopNav() {
  const pathname = usePathname();
  const { totalQty } = useCart();
  const { user } = useAuth();

  const link = (href: string, label: string, icon: React.ReactNode, badge?: number) => {
    const active = pathname === href || (href === '/admin' && pathname.startsWith('/admin'));
    return (
      <Link
        key={href}
        href={href}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
          active
            ? 'bg-primary/20 text-primary'
            : 'text-muted hover:text-primary hover:bg-primary/10'
        }`}
      >
        {icon}
        {label}
        {badge != null && badge > 0 && (
          <span className="bg-primary text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <nav className="hidden md:flex sticky top-0 z-40 bg-surface/95 backdrop-blur-sm border-b border-[#3d3d4d] px-8 h-14 items-center justify-between gap-6">
      <Link href="/" className="shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logos/escritaPodBay.png" alt="PodBay" className="h-8 object-contain" />
      </Link>

      <div className="flex items-center gap-1">
        {user?.role === 'admin' && link('/admin', 'Admin', <ShieldCheck size={16} />)}
        {link('/', 'Início', <Home size={16} />)}
        {link('/cart', 'Carrinho', <ShoppingBag size={16} />, totalQty)}
        {link('/profile', 'Perfil', <User size={16} />)}
      </div>
    </nav>
  );
}
