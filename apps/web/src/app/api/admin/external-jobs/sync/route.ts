import { proxyToApi } from '@/lib/api-proxy';

export async function POST() {
  return proxyToApi('/v1/admin/external-jobs/sync', { method: 'POST' });
}
