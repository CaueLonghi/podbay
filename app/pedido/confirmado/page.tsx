'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';

type Status = 'aguardando' | 'pago' | 'pagamento_recusado' | 'erro';

export default function PedidoConfirmadoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0f1e' }}>
        <Loader2 size={48} className="text-primary animate-spin" />
      </div>
    }>
      <PedidoConfirmadoContent />
    </Suspense>
  );
}

function PedidoConfirmadoContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { finishOrder } = useCart();

  const pedidoId = params.get('order_nsu');
  const receiptFromUrl = params.get('receipt_url');
  const [status, setStatus] = useState<Status>('aguardando');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(receiptFromUrl);
  const [valorTotal, setValorTotal] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cartCleared = useRef(false);

  useEffect(() => {
    if (!pedidoId) {
      setStatus('erro');
      return;
    }

    async function check() {
      const res = await fetch(`/api/pagamento/status?pedido_id=${pedidoId}`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.status === 'pago') {
        setStatus('pago');
        setReceiptUrl(data.receipt_url ?? null);
        setValorTotal(data.valor_total ?? null);
        if (!cartCleared.current) {
          finishOrder();
          cartCleared.current = true;
        }
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else if (data.status === 'pagamento_recusado' || data.status === 'cancelado') {
        setStatus('pagamento_recusado');
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }

    check();
    intervalRef.current = setInterval(check, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [pedidoId]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#0f0f1e' }}>
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">

        {status === 'aguardando' && (
          <>
            <Loader2 size={64} className="text-primary animate-spin" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Aguardando pagamento</h1>
              <p className="text-sm text-muted mt-1">Assim que confirmarmos seu pagamento, esta página será atualizada automaticamente.</p>
            </div>
            <p className="text-xs text-muted/60">Pedido #{pedidoId}</p>
          </>
        )}

        {status === 'pago' && (
          <>
            <CheckCircle2 size={64} className="text-green-400" />
            <div>
              <h1 className="text-xl font-bold text-green-400">Pagamento confirmado!</h1>
              {valorTotal && (
                <p className="text-2xl font-extrabold text-foreground mt-1">{formatPrice(valorTotal)}</p>
              )}
              <p className="text-sm text-muted mt-2">Seu pedido #{pedidoId} foi recebido e está sendo preparado.</p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              {receiptUrl && (
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}
                >
                  <ExternalLink size={16} /> Ver comprovante
                </a>
              )}
              <Link
                href="/profile"
                className="w-full py-3 rounded-2xl text-sm font-bold text-center border border-[#3d3d4d] text-muted hover:text-primary hover:border-primary transition-colors"
              >
                Ver meus pedidos
              </Link>
              <Link
                href="/"
                className="text-xs text-muted hover:text-primary transition-colors"
              >
                Voltar ao catálogo
              </Link>
            </div>
          </>
        )}

        {status === 'pagamento_recusado' && (
          <>
            <XCircle size={64} className="text-red-400" />
            <div>
              <h1 className="text-xl font-bold text-red-400">Pagamento não aprovado</h1>
              <p className="text-sm text-muted mt-1">Seu pedido #{pedidoId} foi registrado mas o pagamento não foi confirmado.</p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => router.push('/cart')}
                className="w-full py-3 rounded-2xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}
              >
                Tentar novamente
              </button>
              <Link href="/" className="text-xs text-muted hover:text-primary transition-colors">
                Voltar ao catálogo
              </Link>
            </div>
          </>
        )}

        {status === 'erro' && (
          <>
            <XCircle size={64} className="text-red-400" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Algo deu errado</h1>
              <p className="text-sm text-muted mt-1">Não conseguimos identificar seu pedido.</p>
            </div>
            <Link href="/" className="text-sm text-primary hover:underline">Voltar ao início</Link>
          </>
        )}

      </div>
    </div>
  );
}
