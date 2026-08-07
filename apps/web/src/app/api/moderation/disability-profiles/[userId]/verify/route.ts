import { proxyToApi } from '@/lib/api-proxy';

export async function POST(request: Request, { params }: { params: { userId: string } }) {
  const body = await request.json();
  return proxyToApi(`/v1/moderation/disability-profiles/${params.userId}/verify`, {
    method: 'POST',
    body,
  });
}
