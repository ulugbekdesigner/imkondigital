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

/** Tarix faqat kirgan foydalanuvchiga tegishli — token yo'q bo'lsa backend
 * 401 qaytaradi, vidjet buni "tarix yo'q" deb ko'radi (mehmon tajribasi
 * o'zgarmaydi). */
export async function GET(): Promise<NextResponse> {
  const token = getAccessToken();
  if (!token) return NextResponse.json({ detail: "Ruxsat yo'q" }, { status: 401 });
  const res = await fetch(`${API_INTERNAL_URL}/v1/ai/ziyo/messages`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(): Promise<NextResponse> {
  const token = getAccessToken();
  if (!token) return NextResponse.json({ detail: "Ruxsat yo'q" }, { status: 401 });
  const res = await fetch(`${API_INTERNAL_URL}/v1/ai/ziyo/messages`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  return new NextResponse(null, { status: res.status });
}
