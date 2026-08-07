import { cookies } from 'next/headers';
import {
  ACCESS_MAX_AGE,
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  isProd,
  REFRESH_MAX_AGE,
} from './api-config';

interface TokenPair {
  access_token: string;
  refresh_token: string;
}

/** Access va refresh token'larni httpOnly cookie'larga yozadi (route handler ichida). */
export function setSessionCookies(tokens: TokenPair): void {
  const store = cookies();
  const base = { httpOnly: true, sameSite: 'lax', secure: isProd, path: '/' } as const;
  store.set(COOKIE_ACCESS, tokens.access_token, { ...base, maxAge: ACCESS_MAX_AGE });
  store.set(COOKIE_REFRESH, tokens.refresh_token, { ...base, maxAge: REFRESH_MAX_AGE });
}

export function clearSessionCookies(): void {
  const store = cookies();
  store.delete(COOKIE_ACCESS);
  store.delete(COOKIE_REFRESH);
}

export function getAccessToken(): string | undefined {
  return cookies().get(COOKIE_ACCESS)?.value;
}

export function getRefreshToken(): string | undefined {
  return cookies().get(COOKIE_REFRESH)?.value;
}
