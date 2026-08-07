import { NextResponse } from 'next/server';
import { API_INTERNAL_URL } from '@/lib/api-config';

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const res = await fetch(`${API_INTERNAL_URL}/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
