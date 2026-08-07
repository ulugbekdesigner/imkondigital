import 'server-only';
import { API_INTERNAL_URL } from './api-config';
import { getAccessToken } from './session';
import type { Certificate, Passport, PortfolioItem } from './types';

/** Public Skills Passport — /u/{username}. viewer token bo'lsa (egasi) private ham ochiladi. */
export async function getPublicPassport(username: string): Promise<Passport | null> {
  const token = getAccessToken();
  const res = await fetch(`${API_INTERNAL_URL}/v1/passport/${encodeURIComponent(username)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as Passport;
}

export async function getMyCertificates(): Promise<Certificate[]> {
  const token = getAccessToken();
  if (!token) return [];
  const res = await fetch(`${API_INTERNAL_URL}/v1/me/certificates`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return (await res.json()) as Certificate[];
}

export async function getMyPortfolio(): Promise<PortfolioItem[]> {
  const token = getAccessToken();
  if (!token) return [];
  const res = await fetch(`${API_INTERNAL_URL}/v1/me/portfolio`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return (await res.json()) as PortfolioItem[];
}
