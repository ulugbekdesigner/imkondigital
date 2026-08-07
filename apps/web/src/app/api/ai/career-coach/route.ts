import { proxyToApi } from '@/lib/api-proxy';

export async function GET() {
  return proxyToApi('/v1/ai/career-coach/messages');
}

export async function POST(request: Request) {
  const body = await request.json();
  return proxyToApi('/v1/ai/career-coach/messages', { method: 'POST', body });
}

export async function DELETE() {
  return proxyToApi('/v1/ai/career-coach/messages', { method: 'DELETE' });
}
