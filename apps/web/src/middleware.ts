import { NextResponse, type NextRequest } from 'next/server';
import {
  ACCESS_MAX_AGE,
  API_INTERNAL_URL,
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  isProd,
  REFRESH_MAX_AGE,
} from '@/lib/api-config';

/**
 * Himoyalangan sahifalar uchun:
 *  - access cookie bo'lsa → o'tkazadi
 *  - faqat refresh bo'lsa → jim yangilaydi (yangi cookie'lar o'rnatiladi)
 *  - hech biri bo'lmasa → /kirish ga yo'naltiradi
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  if (request.cookies.get(COOKIE_ACCESS)) {
    return NextResponse.next();
  }

  const refresh = request.cookies.get(COOKIE_REFRESH)?.value;
  const loginUrl = new URL('/kirish', request.url);
  loginUrl.searchParams.set('next', request.nextUrl.pathname);

  if (!refresh) {
    return NextResponse.redirect(loginUrl);
  }

  const res = await fetch(`${API_INTERNAL_URL}/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  }).catch(() => null);

  if (!res || !res.ok) {
    return NextResponse.redirect(loginUrl);
  }

  const tokens = (await res.json()) as { access_token: string; refresh_token: string };
  const response = NextResponse.next();
  const base = { httpOnly: true, sameSite: 'lax', secure: isProd, path: '/' } as const;
  response.cookies.set(COOKIE_ACCESS, tokens.access_token, { ...base, maxAge: ACCESS_MAX_AGE });
  response.cookies.set(COOKIE_REFRESH, tokens.refresh_token, { ...base, maxAge: REFRESH_MAX_AGE });
  return response;
}

export const config = {
  matcher: ['/profil/:path*', '/trayektoriya/:path*', '/ish-beruvchi/:path*'],
};
