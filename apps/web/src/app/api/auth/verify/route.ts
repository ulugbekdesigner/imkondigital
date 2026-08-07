import { NextResponse } from 'next/server';
import { API_INTERNAL_URL } from '@/lib/api-config';
import { setSessionCookies } from '@/lib/session';

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const res = await fetch(`${API_INTERNAL_URL}/v1/auth/verify-phone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (res.ok) {
    setSessionCookies(data);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json(data, { status: res.status });
}
