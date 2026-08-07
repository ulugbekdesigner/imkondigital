import { NextResponse } from 'next/server';
import { API_INTERNAL_URL } from './api-config';
import { getAccessToken } from './session';

/** Route handler'lardan FastAPI'ga token bilan proxy qiladi — marketplace/orders
 * endpoint'lari uchun tayyor javob shakli takrorlanishini oldini oladi. */
export async function proxyToApi(
  path: string,
  init?: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown },
): Promise<NextResponse> {
  const token = getAccessToken();
  if (!token) {
    return NextResponse.json({ detail: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  }
  const res = await fetch(`${API_INTERNAL_URL}${path}`, {
    method: init?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  });
  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

/** Autentifikatsiyasiz proxy — loginsiz ochiq endpoint'lar uchun (masalan xayriya berish). */
export async function proxyToApiPublic(
  path: string,
  init?: { method?: 'GET' | 'POST'; body?: unknown },
): Promise<NextResponse> {
  const res = await fetch(`${API_INTERNAL_URL}${path}`, {
    method: init?.method ?? 'GET',
    headers: init?.body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  });
  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
