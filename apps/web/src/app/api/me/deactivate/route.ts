import { NextResponse } from 'next/server';
import { API_INTERNAL_URL } from '@/lib/api-config';
import { clearSessionCookies, getAccessToken } from '@/lib/session';

/** Hisobni yopish — backend'da status 'blocked'ga o'tadi va barcha refresh
 * tokenlar bekor qilinadi (api/app/modules/users/service.py deactivate_me),
 * shu yerda esa mijoz cookie'lari tozalanadi (logout bilan bir xil andoza). */
export async function POST(): Promise<NextResponse> {
  const token = getAccessToken();
  if (!token) {
    return NextResponse.json({ detail: 'Avtorizatsiya talab qilinadi' }, { status: 401 });
  }
  const res = await fetch(`${API_INTERNAL_URL}/v1/users/me/deactivate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: 'Xatolik yuz berdi' }));
    return NextResponse.json(data, { status: res.status });
  }
  clearSessionCookies();
  return new NextResponse(null, { status: 204 });
}
