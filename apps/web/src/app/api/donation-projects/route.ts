import { proxyToApi } from '@/lib/api-proxy';

export async function POST(request: Request) {
  const body = await request.json();
  return proxyToApi('/v1/donation-projects', { method: 'POST', body });
}
