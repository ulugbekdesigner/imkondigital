import { NextResponse } from 'next/server';
import { API_INTERNAL_URL } from '@/lib/api-config';
import { getAccessToken } from '@/lib/session';

/** Ziyo — mehmon (loginsiz) va login qilgan foydalanuvchi uchun ochiq,
 * shu sabab token bo'lsa biriktiradi, bo'lmasa ham so'rovni rad etmaydi. */
export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.text();
  const token = getAccessToken();
  const res = await fetch(`${API_INTERNAL_URL}/v1/ai/ziyo/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
    cache: 'no-store',
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
