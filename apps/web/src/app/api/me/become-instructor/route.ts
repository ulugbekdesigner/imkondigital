import { proxyToApi } from '@/lib/api-proxy';

export async function POST() {
  return proxyToApi('/v1/users/me/become-instructor', { method: 'POST' });
}
