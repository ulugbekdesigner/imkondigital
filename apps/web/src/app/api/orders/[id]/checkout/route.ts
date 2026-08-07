import { proxyToApi } from '@/lib/api-proxy';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const provider = new URL(request.url).searchParams.get('provider') ?? 'payme';
  return proxyToApi(`/v1/orders/${params.id}/checkout?provider=${provider}`);
}
