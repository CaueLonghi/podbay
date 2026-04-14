const POSITIONSTACK_KEY = process.env.POSITIONSTACK_KEY ?? '';

export async function geocodeEndereco(
  logradouro: string,
  numero: string,
  cidade: string,
  estado: string
): Promise<{ lat: number; lng: number }> {
  const query = `${logradouro}, ${numero}, ${cidade}, ${estado}, Brasil`;
  const url = `http://api.positionstack.com/v1/forward?access_key=${POSITIONSTACK_KEY}&query=${encodeURIComponent(query)}&limit=1`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`PositionStack error ${res.status}`);

  const data = await res.json();
  const first = data?.data?.[0];
  if (!first) throw new Error('Endereço não encontrado no geocoding');

  return { lat: Number(first.latitude), lng: Number(first.longitude) };
}
