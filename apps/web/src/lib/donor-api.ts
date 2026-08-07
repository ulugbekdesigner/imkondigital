import 'server-only';
import { API_INTERNAL_URL } from './api-config';
import { getAccessToken } from './session';
import type { DonorOverview, DonorProgramOut, ProgramEnrollmentOut } from './types';

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

export function getActivePrograms(): Promise<DonorProgramOut[]> {
  return fetch(`${API_INTERNAL_URL}/v1/programs`, { cache: 'no-store' })
    .then((res) => (res.ok ? (res.json() as Promise<DonorProgramOut[]>) : []))
    .catch(() => []);
}

export function getMyPrograms(): Promise<DonorProgramOut[]> {
  return authedGet<DonorProgramOut[]>('/v1/donor/programs').then((items) => items ?? []);
}

export function getProgramApplications(programId: number): Promise<ProgramEnrollmentOut[]> {
  return authedGet<ProgramEnrollmentOut[]>(
    `/v1/donor/programs/${programId}/applications`,
  ).then((items) => items ?? []);
}

export function getDonorOverview(): Promise<DonorOverview | null> {
  return authedGet<DonorOverview>('/v1/analytics/donor/overview');
}

/**
 * getMyPrograms/getProgramApplications bo'sh ro'yxat va tarmoq xatosini bir
 * xil [] bilan qaytaradi — donor sahifalari ikkalasini VIZUAL jihatdan
 * ajratishi (bo'sh holat vs xato holati, docs/design/README.md talabi) uchun natijani
 * aniq belgilaydigan shu qo'shimcha funksiyalar ishlatiladi (donation-api.ts
 * dagi getActiveDonationProjectsResult andozasi bo'yicha).
 */
export async function getMyProgramsResult(): Promise<
  { ok: true; programs: DonorProgramOut[] } | { ok: false }
> {
  const token = getAccessToken();
  if (!token) return { ok: false };
  try {
    const res = await fetch(`${API_INTERNAL_URL}/v1/donor/programs`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return { ok: false };
    return { ok: true, programs: (await res.json()) as DonorProgramOut[] };
  } catch {
    return { ok: false };
  }
}

export async function getProgramApplicationsResult(
  programId: number,
): Promise<{ ok: true; applications: ProgramEnrollmentOut[] } | { ok: false }> {
  const token = getAccessToken();
  if (!token) return { ok: false };
  try {
    const res = await fetch(`${API_INTERNAL_URL}/v1/donor/programs/${programId}/applications`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return { ok: false };
    return { ok: true, applications: (await res.json()) as ProgramEnrollmentOut[] };
  } catch {
    return { ok: false };
  }
}
