import { proxyToApi } from '@/lib/api-proxy';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  return proxyToApi(`/v1/ai/placement-test/sessions/${params.id}/messages`, {
    method: 'POST',
    body,
  });
}
