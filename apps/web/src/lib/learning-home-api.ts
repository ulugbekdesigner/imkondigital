import 'server-only';
import { API_INTERNAL_URL } from './api-config';
import { getAccessToken } from './session';
import type { LearningHomeOut, StreakOut } from './types';

export async function getLearningHome(): Promise<LearningHomeOut | null> {
  const token = getAccessToken();
  if (!token) return null;
  const res = await fetch(`${API_INTERNAL_URL}/v1/me/learning-home`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as LearningHomeOut;
}

export async function getMyStreak(): Promise<StreakOut | null> {
  const token = getAccessToken();
  if (!token) return null;
  const res = await fetch(`${API_INTERNAL_URL}/v1/me/streak`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as StreakOut;
}
