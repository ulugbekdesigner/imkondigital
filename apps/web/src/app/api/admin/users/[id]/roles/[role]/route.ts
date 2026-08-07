import { proxyToApi } from '@/lib/api-proxy';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; role: string } },
) {
  return proxyToApi(`/v1/admin/users/${params.id}/roles/${params.role}`, { method: 'DELETE' });
}
