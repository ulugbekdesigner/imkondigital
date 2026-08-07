import { proxyToApi } from '@/lib/api-proxy';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  return proxyToApi(`/v1/courses/${params.id}/final-status`);
}
