import 'server-only';
import { API_INTERNAL_URL } from './api-config';
import type { SupportContent, SupportResource } from './types';

/** Server/tarmoq xatosi — "hali kontent yo'q" bo'sh holatidan ataylab
 * ajratilgan (docs/design/README.md: xato va bo'sh holat aralashmasin). Bu bo'lim
 * shoshilinch yordam raqamlarini ko'rsatadi — yuklanmasa sukut emas,
 * aniq xato ko'rsatilishi shart. */
export class SupportFetchError extends Error {}

export async function getSupportContents(): Promise<SupportContent[]> {
  let res: Response;
  try {
    res = await fetch(`${API_INTERNAL_URL}/v1/support/contents`, { cache: 'no-store' });
  } catch {
    throw new SupportFetchError("Maslahatlar ro'yxatini yuklab bo'lmadi.");
  }
  if (!res.ok) throw new SupportFetchError("Maslahatlar ro'yxatini yuklab bo'lmadi.");
  return (await res.json()) as SupportContent[];
}

export async function getSupportResources(): Promise<SupportResource[]> {
  let res: Response;
  try {
    res = await fetch(`${API_INTERNAL_URL}/v1/support/resources`, { cache: 'no-store' });
  } catch {
    throw new SupportFetchError("Yordam raqamlarini yuklab bo'lmadi.");
  }
  if (!res.ok) throw new SupportFetchError("Yordam raqamlarini yuklab bo'lmadi.");
  return (await res.json()) as SupportResource[];
}
