import { proxyToApi } from '@/lib/api-proxy';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pendingOnly = url.searchParams.get('pending_only') ?? 'true';
  return proxyToApi(`/v1/me/mentor/assessments?pending_only=${pendingOnly}`);
}
