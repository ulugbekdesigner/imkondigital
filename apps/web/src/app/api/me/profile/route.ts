import { proxyToApi } from '@/lib/api-proxy';

export async function PATCH(request: Request) {
  const body = await request.json();
  return proxyToApi('/v1/users/me', { method: 'PATCH', body });
}
