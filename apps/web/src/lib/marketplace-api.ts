import 'server-only';
import { API_INTERNAL_URL } from './api-config';
import { getAccessToken } from './session';
import type { GigDetail, GigPage, MessageOut, OrderCard, OrderDetail } from './types';

/** Server/tarmoq xatosi — "bo'sh natija"dan farqli, sahifa `.imk-error`
 * holatini ko'rsatishi kerak (docs/design/README.md: xato va bo'sh holat aralashmasin). */
export class MarketplaceFetchError extends Error {}

/** Buyurtma boshqa foydalanuvchiga tegishli (403) — `.imk-locked` holati
 * uchun, "topilmadi" (404) bilan ARALASHTIRILMAYDI. */
export class OrderForbiddenError extends Error {}

export async function getGigCatalog(params: { category?: string; q?: string }): Promise<GigPage> {
  const search = new URLSearchParams();
  if (params.category) search.set('category', params.category);
  if (params.q) search.set('q', params.q);
  let res: Response;
  try {
    res = await fetch(`${API_INTERNAL_URL}/v1/gigs?${search.toString()}`, { cache: 'no-store' });
  } catch {
    throw new MarketplaceFetchError('Xizmatlar katalogini yuklab bo\'lmadi.');
  }
  if (!res.ok) throw new MarketplaceFetchError('Xizmatlar katalogini yuklab bo\'lmadi.');
  return (await res.json()) as GigPage;
}

export async function getGig(id: number): Promise<GigDetail | null> {
  let res: Response;
  try {
    res = await fetch(`${API_INTERNAL_URL}/v1/gigs/${id}`, { cache: 'no-store' });
  } catch {
    throw new MarketplaceFetchError('Xizmat ma\'lumotini yuklab bo\'lmadi.');
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new MarketplaceFetchError('Xizmat ma\'lumotini yuklab bo\'lmadi.');
  return (await res.json()) as GigDetail;
}

export async function getMyOrders(role?: 'client' | 'freelancer'): Promise<OrderCard[]> {
  const token = getAccessToken();
  if (!token) return [];
  const search = role ? `?role=${role}` : '';
  const res = await fetch(`${API_INTERNAL_URL}/v1/me/orders${search}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return (await res.json()) as OrderCard[];
}

/** `getMyOrders`ning "qattiq" varianti — /buyurtmalarim sahifasida haqiqiy
 * server xatosini bo'sh ro'yxatdan ajratish uchun (getMyOrders o'zi
 * /profil sahifasida ham ishlatiladi, uning xulq-atvorini o'zgartirmaslik
 * kerak). */
export async function getMyOrdersStrict(role?: 'client' | 'freelancer'): Promise<OrderCard[]> {
  const token = getAccessToken();
  if (!token) return [];
  const search = role ? `?role=${role}` : '';
  let res: Response;
  try {
    res = await fetch(`${API_INTERNAL_URL}/v1/me/orders${search}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch {
    throw new MarketplaceFetchError('Buyurtmalarni yuklab bo\'lmadi.');
  }
  if (!res.ok) throw new MarketplaceFetchError('Buyurtmalarni yuklab bo\'lmadi.');
  return (await res.json()) as OrderCard[];
}

export async function getOrder(id: number): Promise<OrderDetail | null> {
  const token = getAccessToken();
  if (!token) return null;
  let res: Response;
  try {
    res = await fetch(`${API_INTERNAL_URL}/v1/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch {
    throw new MarketplaceFetchError('Buyurtma ma\'lumotini yuklab bo\'lmadi.');
  }
  if (res.status === 404) return null;
  if (res.status === 403) throw new OrderForbiddenError('Bu buyurtma sizga tegishli emas.');
  if (!res.ok) throw new MarketplaceFetchError('Buyurtma ma\'lumotini yuklab bo\'lmadi.');
  return (await res.json()) as OrderDetail;
}

export async function getOrderMessages(id: number): Promise<MessageOut[]> {
  const token = getAccessToken();
  if (!token) return [];
  const res = await fetch(`${API_INTERNAL_URL}/v1/orders/${id}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return [];
  return (await res.json()) as MessageOut[];
}
