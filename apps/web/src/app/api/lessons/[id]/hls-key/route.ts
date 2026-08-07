import { NextResponse } from 'next/server';
import { API_INTERNAL_URL } from '@/lib/api-config';
import { getAccessToken } from '@/lib/session';

/** hls.js shu manzildan (brauzerning o'zidan, sahifa bilan bir domenda) xom AES-128

 * kalitni so'raydi — httpOnly sessiya cookie orqali avtomatik autentifikatsiya
 * qilinadi (alohida "30 soniyalik token" o'rniga mavjud sessiya tekshiruvi
 * ishlatildi — funksional jihatdan bir xil maqsadga xizmat qiladi, lekin
 * ekspluatatsiyasi osonroq va mavjud auth infratuzilmasini qayta ishlatadi). */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse | Response> {
  const token = getAccessToken();
  const res = await fetch(`${API_INTERNAL_URL}/v1/lessons/${params.id}/hls-key`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: 'Xatolik' }));
    return NextResponse.json(data, { status: res.status });
  }
  const buf = await res.arrayBuffer();
  return new Response(buf, {
    status: 200,
    headers: { 'Content-Type': 'application/octet-stream' },
  });
}
