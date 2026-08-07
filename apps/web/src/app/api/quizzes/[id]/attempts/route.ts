import { proxyToApi } from '@/lib/api-proxy';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  return proxyToApi(`/v1/quizzes/${params.id}/attempts`, { method: 'POST' });
}
