import HomeClient from '@/components/HomeClient';
import { getProdutos } from '@/lib/catalogo';

export default async function HomePage() {
  const produtos = await getProdutos();
  return <HomeClient produtos={produtos} />;
}
