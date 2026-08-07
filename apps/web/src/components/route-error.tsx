'use client';

import { useEffect } from 'react';
import { Button } from '@imkon/ui';
import { AlertIcon, RefreshIcon } from '@/components/shell-icons';

/** Route segmenti (error.tsx) uchun umumiy xato ekrani — Next.js talabiga
 * ko'ra bu klient komponent bo'lishi shart. `.imk-error` bilan bir xil
 * vizual til, lekin `reset()` Next.js'ning o'z mexanizmi orqali segmentni
 * qayta render qiladi (RetryButton'dagi router.refresh()dan farqli). */
export function RouteError({
  error,
  reset,
  title = 'Nimadir xato ketdi',
  description = "Sahifani yuklashda kutilmagan xatolik yuz berdi. Qayta urinib ko'ring.",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="imk-error" role="alert">
        <span className="imk-error__icon" aria-hidden="true">
          <AlertIcon width={24} height={24} />
        </span>
        <div>
          <h1 className="font-display text-lg font-bold text-ink">{title}</h1>
          <p className="mt-1 max-w-xl font-sans text-base text-ink-soft">{description}</p>
        </div>
        <Button type="button" variant="outline" onClick={reset}>
          <RefreshIcon width={16} height={16} aria-hidden="true" />
          Qayta urinish
        </Button>
      </div>
    </div>
  );
}
