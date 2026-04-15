const HANDLE = process.env.INFINITEPAY_HANDLE ?? 'leonardoluc';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://podbay-dev.vercel.app';
const API = 'https://api.infinitepay.io/invoices/public/checkout';

export interface ItemIP {
  description: string;
  quantity: number;
  price: number; // centavos
}

export interface CriarLinkParams {
  pedidoId: number | string;
  itens: ItemIP[];
  nomeCliente?: string;
  telefoneCliente?: string;
}

export interface CriarLinkResult {
  url: string;
}

export async function criarLinkPagamento(params: CriarLinkParams): Promise<CriarLinkResult> {
  const { pedidoId, itens, nomeCliente, telefoneCliente } = params;

  const body: Record<string, unknown> = {
    handle: HANDLE,
    order_nsu: String(pedidoId),
    redirect_url: `${BASE_URL}/pedido/confirmado`,
    webhook_url: `${BASE_URL}/api/pagamento/webhook`,
    items: itens,
  };

  if (nomeCliente || telefoneCliente) {
    body.customer = {
      ...(nomeCliente ? { name: nomeCliente } : {}),
      ...(telefoneCliente ? { phone_number: telefoneCliente } : {}),
    };
  }

  const res = await fetch(`${API}/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`InfinitePay error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return { url: data.url ?? data.checkout_url ?? data.link };
}
