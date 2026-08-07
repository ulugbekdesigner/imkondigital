import { proxyToApi } from '@/lib/api-proxy';

export async function POST() {
  return proxyToApi('/v1/me/impact-certificate', { method: 'POST' });
}
