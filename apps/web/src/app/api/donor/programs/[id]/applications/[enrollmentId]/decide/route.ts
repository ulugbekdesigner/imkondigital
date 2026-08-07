import { proxyToApi } from '@/lib/api-proxy';

export async function POST(
  request: Request,
  { params }: { params: { id: string; enrollmentId: string } },
) {
  const { approve } = (await request.json()) as { approve: boolean };
  const action = approve ? 'approve' : 'reject';
  return proxyToApi(
    `/v1/donor/programs/${params.id}/applications/${params.enrollmentId}/${action}`,
    { method: 'POST' },
  );
}
