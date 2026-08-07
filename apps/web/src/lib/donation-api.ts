import 'server-only';
import { API_INTERNAL_URL } from './api-config';
import { getAccessToken } from './session';
import type { DonationOut, DonationProjectOut } from './types';

async function authedGet<T>(path: string): Promise<T | null> {
  const token = getAccessToken();
  if (!token) return null;
  const res = await fetch(`${API_INTERNAL_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as T;
}

export function getActiveDonationProjects(status?: string): Promise<DonationProjectOut[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return fetch(`${API_INTERNAL_URL}/v1/donation-projects${qs}`, { cache: 'no-store' })
    .then((res) => (res.ok ? (res.json() as Promise<DonationProjectOut[]>) : []))
    .catch(() => []);
}

/**
 * getActiveDonationProjects bo'sh ro'yxat va tarmoq xatosini bir xil []
 * bilan qaytaradi — /xayriya sahifasi ikkalasini VIZUAL jihatdan ajratishi
 * (bo'sh holat vs xato holati, docs/design/README.md talabi) uchun natijani aniq
 * belgilaydigan shu qo'shimcha funksiya ishlatiladi. Mavjud eksport
 * o'zgartirilmadi — /bosh sahifa va /donorlarga hali ham eskisidan foydalanadi.
 */
export async function getActiveDonationProjectsResult(
  status?: string,
): Promise<{ ok: true; projects: DonationProjectOut[] } | { ok: false }> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  try {
    const res = await fetch(`${API_INTERNAL_URL}/v1/donation-projects${qs}`, { cache: 'no-store' });
    if (!res.ok) return { ok: false };
    return { ok: true, projects: (await res.json()) as DonationProjectOut[] };
  } catch {
    return { ok: false };
  }
}

export function getDonationProject(id: number): Promise<DonationProjectOut | null> {
  return fetch(`${API_INTERNAL_URL}/v1/donation-projects/${id}`, { cache: 'no-store' })
    .then((res) => (res.ok ? (res.json() as Promise<DonationProjectOut>) : null))
    .catch(() => null);
}

export function getMyDonationProjects(): Promise<DonationProjectOut[]> {
  return authedGet<DonationProjectOut[]>('/v1/donation-projects/mine').then(
    (items) => items ?? [],
  );
}

export function getProjectDonations(projectId: number): Promise<DonationOut[]> {
  return authedGet<DonationOut[]>(`/v1/donation-projects/${projectId}/donations`).then(
    (items) => items ?? [],
  );
}

/**
 * getMyDonationProjects/getProjectDonations bo'sh ro'yxat va tarmoq xatosini
 * bir xil [] bilan qaytaradi — donor sahifalari ikkalasini VIZUAL jihatdan
 * ajratishi (bo'sh holat vs xato holati, docs/design/README.md talabi) uchun natijani
 * aniq belgilaydigan shu qo'shimcha funksiyalar ishlatiladi (yuqoridagi
 * getActiveDonationProjectsResult andozasi bo'yicha).
 */
export async function getMyDonationProjectsResult(): Promise<
  { ok: true; projects: DonationProjectOut[] } | { ok: false }
> {
  const token = getAccessToken();
  if (!token) return { ok: false };
  try {
    const res = await fetch(`${API_INTERNAL_URL}/v1/donation-projects/mine`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return { ok: false };
    return { ok: true, projects: (await res.json()) as DonationProjectOut[] };
  } catch {
    return { ok: false };
  }
}

export async function getProjectDonationsResult(
  projectId: number,
): Promise<{ ok: true; donations: DonationOut[] } | { ok: false }> {
  const token = getAccessToken();
  if (!token) return { ok: false };
  try {
    const res = await fetch(`${API_INTERNAL_URL}/v1/donation-projects/${projectId}/donations`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return { ok: false };
    return { ok: true, donations: (await res.json()) as DonationOut[] };
  } catch {
    return { ok: false };
  }
}
