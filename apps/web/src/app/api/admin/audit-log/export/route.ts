import { API_INTERNAL_URL } from '@/lib/api-config';
import { getAccessToken } from '@/lib/session';

export async function GET(): Promise<Response> {
  const token = getAccessToken();
  if (!token) {
    return new Response('Avtorizatsiya talab qilinadi', { status: 401 });
  }
  const res = await fetch(`${API_INTERNAL_URL}/v1/admin/audit-log/export`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    return new Response('Eksport amalga oshmadi', { status: res.status });
  }
  return new Response(res.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': res.headers.get('content-disposition') ?? 'attachment; filename=audit-jurnali.csv',
    },
  });
}
