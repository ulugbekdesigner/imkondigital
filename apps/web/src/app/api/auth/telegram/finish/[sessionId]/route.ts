import { NextResponse } from 'next/server';
import { API_INTERNAL_URL } from '@/lib/api-config';
import { setSessionCookies } from '@/lib/session';

export async function POST(
  _request: Request,
  { params }: { params: { sessionId: string } },
): Promise<NextResponse> {
  const res = await fetch(`${API_INTERNAL_URL}/v1/auth/telegram/finish/${params.sessionId}`, {
    method: 'POST',
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok) {
    setSessionCookies(data);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json(data, { status: res.status });
}
