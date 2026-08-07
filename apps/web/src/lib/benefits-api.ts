import 'server-only';
import { API_INTERNAL_URL } from './api-config';
import { getAccessToken } from './session';
import type { BenefitCard, BenefitDetail, BenefitPage } from './types';

/** `null` — server/tarmoq xatosi (`.imk-error` ko'rsatiladi), `{ items: [] }` —
 * so'rov muvaffaqiyatli, lekin haqiqatan imtiyoz yo'q (`.imk-empty`). */
export async function getBenefitCatalog(params: {
  audience?: string;
  providerType?: string;
}): Promise<BenefitPage | null> {
  const search = new URLSearchParams();
  if (params.audience) search.set('audience', params.audience);
  if (params.providerType) search.set('provider_type', params.providerType);
  const token = getAccessToken();
  const res = await fetch(`${API_INTERNAL_URL}/v1/benefits?${search.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as BenefitPage;
}

export async function getBenefit(id: number): Promise<BenefitDetail | null> {
  const token = getAccessToken();
  const res = await fetch(`${API_INTERNAL_URL}/v1/benefits/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as BenefitDetail;
}

export async function getMySavedBenefits(): Promise<BenefitCard[]> {
  const token = getAccessToken();
  if (!token) return [];
  const res = await fetch(`${API_INTERNAL_URL}/v1/benefits/me/saved`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return (await res.json()) as BenefitCard[];
}
