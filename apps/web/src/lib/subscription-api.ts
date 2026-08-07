import 'server-only';
import { API_INTERNAL_URL } from './api-config';
import { getAccessToken } from './session';
import type { SubscriptionOut, SubscriptionPricing } from './types';

export async function getSubscriptionPricing(): Promise<SubscriptionPricing> {
  const res = await fetch(`${API_INTERNAL_URL}/v1/subscriptions/pricing`, {
    next: { revalidate: 3600 },
  }).catch(() => null);
  if (!res || !res.ok) return { plus_price_som: 0, pro_price_som: 0 };
  return (await res.json()) as SubscriptionPricing;
}

export async function getMySubscription(): Promise<SubscriptionOut | null> {
  const token = getAccessToken();
  if (!token) return null;
  const res = await fetch(`${API_INTERNAL_URL}/v1/me/subscription`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as SubscriptionOut;
}
