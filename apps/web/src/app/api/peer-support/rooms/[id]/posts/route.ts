import { proxyToApi } from '@/lib/api-proxy';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  return proxyToApi(`/v1/peer-support/rooms/${params.id}/posts`);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  return proxyToApi(`/v1/peer-support/rooms/${params.id}/posts`, { method: 'POST', body });
}
