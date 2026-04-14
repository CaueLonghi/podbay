const UBER_TOKEN = process.env.UBER_SERVER_TOKEN ?? '';

export interface FreteResult {
  valor: number;
  produto: string;
  distancia: number; // miles
}

export async function estimarFreteUberMoto(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<FreteResult> {
  const params = new URLSearchParams({
    start_latitude: String(startLat),
    start_longitude: String(startLng),
    end_latitude: String(endLat),
    end_longitude: String(endLng),
  });

  const res = await fetch(`https://api.uber.com/v1.2/estimates/price?${params}`, {
    headers: { Authorization: `Token ${UBER_TOKEN}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Uber API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const prices: Array<{
    display_name: string;
    low_estimate: number;
    high_estimate: number;
    distance: number;
  }> = data.prices ?? [];

  // Filtra pelo produto MOTO
  const moto = prices.find((p) =>
    p.display_name?.toLowerCase().includes('moto')
  );

  if (!moto) {
    // Fallback: menor preço disponível
    const menor = prices.sort((a, b) => (a.low_estimate ?? 0) - (b.low_estimate ?? 0))[0];
    if (!menor) throw new Error('Nenhum produto Uber disponível para este trajeto');
    return { valor: menor.low_estimate, produto: menor.display_name, distancia: menor.distance };
  }

  return { valor: moto.low_estimate, produto: moto.display_name, distancia: moto.distance };
}
