import type { Metadata, Viewport } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { getSessionUser } from '@/lib/session';
import TopNav from '@/components/TopNav';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PODBAY',
  description: 'Seu delivery favorito de PODs',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <html lang="pt-BR" className={dmSans.variable}>
      <body className="bg-background text-foreground font-sans">
        <AuthProvider initialUser={user}>
          <ToastProvider>
            <CartProvider>
              <div className="min-h-screen flex flex-col">
                <TopNav />
                {children}
              </div>
            </CartProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
