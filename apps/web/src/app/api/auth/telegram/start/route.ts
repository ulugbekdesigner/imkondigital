import { NextResponse } from 'next/server';
import { API_INTERNAL_URL } from '@/lib/api-config';

/** Ochiq (loginsiz) - "Telegram bilan kirish" hali hisobsiz odam uchun ham. */
export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.text();
  const res = await fetch(`${API_INTERNAL_URL}/v1/auth/telegram/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
