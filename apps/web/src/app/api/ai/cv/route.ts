import { proxyToApi } from '@/lib/api-proxy';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return proxyToApi('/v1/ai/cv/generate', { method: 'POST', body });
}
