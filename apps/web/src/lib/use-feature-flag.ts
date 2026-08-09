'use client';

import { useEffect, useState } from 'react';

/**
 * Xususiyat bayroqlarini bitta marta yuklab, keshda saqlaydi - istalgancha
 * useFlag() chaqirilsa ham faqat bitta tarmoq so'rovi bo'ladi.
 */
let flagsCache: Promise<Record<string, boolean>> | null = null;

function loadFlags(): Promise<Record<string, boolean>> {
  flagsCache ??= fetch('/api/feature-flags', { cache: 'no-store' })
    .then((res) => (res.ok ? res.json() : {}))
    .catch(() => ({}));
  return flagsCache;
}

/**
 * Yangi funksiyani xavfsiz yoqish uchun - `if (useFlag('voice_tts')) { ... }`.
 * Yuklanayotganda va xato holatida standart qiymat FALSE (funksiya yashirin) -
 * mavjud sahifa har doim bugungidek ishlashda davom etadi.
 */
export function useFlag(name: string): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadFlags().then((flags) => {
      if (!cancelled) setEnabled(Boolean(flags[name]));
    });
    return () => {
      cancelled = true;
    };
  }, [name]);

  return enabled;
}
