import { proxyToApi, proxyToApiPublic } from '@/lib/api-proxy';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  return proxyToApiPublic(`/v1/courses/${params.id}/reviews`);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  return proxyToApi(`/v1/courses/${params.id}/reviews`, { method: 'POST', body });
}
