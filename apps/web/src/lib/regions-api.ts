import 'server-only';
import { API_INTERNAL_URL } from './api-config';
import type { Region, RegionCard, RegionDetail } from './types';

export async function getRegions(): Promise<Region[]> {
  const res = await fetch(`${API_INTERNAL_URL}/v1/regions`, { cache: 'no-store' }).catch(
    () => null,
  );
  if (!res || !res.ok) return [];
  return (await res.json()) as Region[];
}

/** `null` — server/tarmoq xatosi (`.imk-error` ko'rsatiladi), bo'sh ro'yxat —
 * so'rov muvaffaqiyatli, lekin haqiqatan hudud yo'q (`.imk-empty`). */
export async function getRegionsWithStats(): Promise<RegionCard[] | null> {
  const res = await fetch(`${API_INTERNAL_URL}/v1/regions/with-stats`, {
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as RegionCard[];
}

export async function getRegionDetail(slug: string): Promise<RegionDetail | null> {
  const res = await fetch(`${API_INTERNAL_URL}/v1/regions/${slug}`, {
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as RegionDetail;
}
