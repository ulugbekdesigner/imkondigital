import 'server-only';
import { API_INTERNAL_URL } from './api-config';
import { getAccessToken } from './session';
import type { ExternalJobDetail, ExternalJobPage } from './types';

/** `null` — server/tarmoq xatosi (`.imk-error` ko'rsatiladi), bo'sh `items` —
 * so'rov muvaffaqiyatli, lekin haqiqatan e'lon yo'q (`.imk-empty`). */
export async function getExternalJobs(
  params: { cursor?: number } = {},
): Promise<ExternalJobPage | null> {
  const search = new URLSearchParams();
  if (params.cursor !== undefined) search.set('cursor', String(params.cursor));

  const token = getAccessToken();
  const res = await fetch(`${API_INTERNAL_URL}/v1/external-jobs?${search.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as ExternalJobPage;
}

export async function getExternalJob(id: number): Promise<ExternalJobDetail | null> {
  const token = getAccessToken();
  const res = await fetch(`${API_INTERNAL_URL}/v1/external-jobs/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as ExternalJobDetail;
}
