import { NextResponse } from 'next/server';
import { API_INTERNAL_URL } from '@/lib/api-config';
import { clearSessionCookies, getRefreshToken } from '@/lib/session';

export async function POST(): Promise<NextResponse> {
  const refresh = getRefreshToken();
  if (refresh) {
    // Backend'da refresh token'ni bekor qilamiz (idempotent)
    await fetch(`${API_INTERNAL_URL}/v1/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    }).catch(() => undefined);
  }
  clearSessionCookies();
  return NextResponse.json({ ok: true });
}
