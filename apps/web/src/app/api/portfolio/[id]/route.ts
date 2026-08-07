import { proxyToApi } from '@/lib/api-proxy';

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  return proxyToApi(`/v1/me/portfolio/${params.id}`, { method: 'DELETE' });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  return proxyToApi(`/v1/me/portfolio/${params.id}`, { method: 'PATCH', body });
}
