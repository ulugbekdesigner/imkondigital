import 'server-only';
import { API_INTERNAL_URL } from './api-config';
import { getAccessToken } from './session';
import type { GovOverview } from './types';

export function getGovOverview(): Promise<GovOverview | null> {
  const token = getAccessToken();
  if (!token) return Promise.resolve(null);
  return fetch(`${API_INTERNAL_URL}/v1/analytics/gov/overview`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
    .then((res) => (res.ok ? (res.json() as Promise<GovOverview>) : null))
    .catch(() => null);
}
