import { proxyToApi } from '@/lib/api-proxy';

export async function GET(_request: Request, { params }: { params: { lessonId: string } }) {
  return proxyToApi(`/v1/ai/study-buddy/${params.lessonId}/messages`);
}

export async function POST(request: Request, { params }: { params: { lessonId: string } }) {
  const body = await request.json();
  return proxyToApi(`/v1/ai/study-buddy/${params.lessonId}/messages`, { method: 'POST', body });
}
