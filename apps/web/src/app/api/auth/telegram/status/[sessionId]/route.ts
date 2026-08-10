import { NextResponse } from 'next/server';
import { API_INTERNAL_URL } from '@/lib/api-config';

export async function GET(
  _request: Request,
  { params }: { params: { sessionId: string } },
): Promise<NextResponse> {
  const res = await fetch(`${API_INTERNAL_URL}/v1/auth/telegram/status/${params.sessionId}`, {
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
