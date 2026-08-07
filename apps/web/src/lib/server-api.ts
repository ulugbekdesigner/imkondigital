import 'server-only';
import { API_INTERNAL_URL } from './api-config';
import { getAccessToken } from './session';
import type { DisabilityProfileOut, Me, Trajectory } from './types';

/** Server komponentlar uchun autentifikatsiyalangan GET. 401 → null (sahifa kirishga yo'naltiradi). */
async function authedGet<T>(path: string): Promise<T | null> {
  const token = getAccessToken();
  if (!token) return null;

  const res = await fetch(`${API_INTERNAL_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export function getMe(): Promise<Me | null> {
  return authedGet<Me>('/v1/users/me');
}

export function getTrajectory(): Promise<Trajectory | null> {
  return authedGet<Trajectory>('/v1/users/me/trajectory');
}

/** Profil to'ldirilmagan bo'lsa yoki xato bo'lsa null (authedGet 404'ni ham null qiladi). */
export function getMyDisabilityProfile(): Promise<DisabilityProfileOut | null> {
  return authedGet<DisabilityProfileOut>('/v1/users/me/disability-profile');
}
