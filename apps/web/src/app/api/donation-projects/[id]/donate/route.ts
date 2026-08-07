import { proxyToApiPublic } from '@/lib/api-proxy';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  return proxyToApiPublic(`/v1/donation-projects/${params.id}/donate`, { method: 'POST', body });
}
