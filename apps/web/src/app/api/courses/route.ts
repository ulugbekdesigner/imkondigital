import { proxyToApi, proxyToApiPublic } from '@/lib/api-proxy';

export async function GET(request: Request) {
  const { search } = new URL(request.url);
  return proxyToApiPublic(`/v1/courses${search}`);
}

export async function POST(request: Request) {
  const body = await request.json();
  return proxyToApi('/v1/courses', { method: 'POST', body });
}
