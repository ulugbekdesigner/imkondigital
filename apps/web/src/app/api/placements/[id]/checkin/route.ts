import { NextResponse } from 'next/server';
import { API_INTERNAL_URL } from '@/lib/api-config';
import { getAccessToken } from '@/lib/session';

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const token = getAccessToken();
  if (!token) {
    return NextResponse.json({ detail: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  }
  const body = await request.json();
  const res = await fetch(`${API_INTERNAL_URL}/v1/placements/${params.id}/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
