import { NextResponse } from 'next/server';
import { API_INTERNAL_URL } from '@/lib/api-config';
import { getAccessToken } from '@/lib/session';

/** Ochiq - mehmon uchun ham ishlaydi, token bo'lsa biriktiradi (rollout-foiz
 * foydalanuvchi ID'siga bog'liq bo'lishi mumkin). */
export async function GET(): Promise<NextResponse> {
  const token = getAccessToken();
  const res = await fetch(`${API_INTERNAL_URL}/v1/feature-flags`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
