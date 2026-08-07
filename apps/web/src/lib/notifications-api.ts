import 'server-only';
import { API_INTERNAL_URL } from './api-config';
import { getAccessToken } from './session';
import type { NotificationPage, TelegramLinkStatusOut } from './types';

export async function getMyNotifications(): Promise<NotificationPage> {
  const token = getAccessToken();
  if (!token) return { items: [], unread_count: 0 };
  const res = await fetch(`${API_INTERNAL_URL}/v1/me/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return { items: [], unread_count: 0 };
  return (await res.json()) as NotificationPage;
}

export async function getTelegramStatus(): Promise<TelegramLinkStatusOut> {
  const token = getAccessToken();
  if (!token) return { linked: false };
  const res = await fetch(`${API_INTERNAL_URL}/v1/me/telegram/status`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return { linked: false };
  return (await res.json()) as TelegramLinkStatusOut;
}
