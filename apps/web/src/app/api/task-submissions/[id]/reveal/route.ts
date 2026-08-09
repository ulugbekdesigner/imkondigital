import { NextResponse } from 'next/server';
import { API_INTERNAL_URL } from '@/lib/api-config';
import { getAccessToken } from '@/lib/session';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const token = getAccessToken();
  if (!token) {
    return NextResponse.json({ detail: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  }
  const res = await fetch(`${API_INTERNAL_URL}/v1/task-submissions/${params.id}/reveal`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
