import { proxyToApi } from '@/lib/api-proxy';

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  return proxyToApi(`/v1/courses/${params.id}`, { method: 'DELETE' });
}
