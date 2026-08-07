import { proxyToApi } from '@/lib/api-proxy';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  return proxyToApi(`/v1/donor/programs/${params.id}/status`, { method: 'PATCH', body });
}
