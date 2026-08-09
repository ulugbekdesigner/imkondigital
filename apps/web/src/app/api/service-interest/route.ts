import { NextResponse } from 'next/server';
import { API_INTERNAL_URL } from '@/lib/api-config';

/** Ochiq - autentifikatsiya kerak emas. */
export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.text();
  const res = await fetch(`${API_INTERNAL_URL}/v1/service-interest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
