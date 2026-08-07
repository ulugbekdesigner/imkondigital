import { proxyToApi } from '@/lib/api-proxy';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  return proxyToApi(`/v1/admin/users/${params.id}/status`, { method: 'PATCH', body });
}
