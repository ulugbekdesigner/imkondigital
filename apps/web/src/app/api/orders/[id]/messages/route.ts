import { proxyToApi } from '@/lib/api-proxy';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  return proxyToApi(`/v1/orders/${params.id}/messages`);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  return proxyToApi(`/v1/orders/${params.id}/messages`, { method: 'POST', body });
}
