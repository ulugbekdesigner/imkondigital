'use client';

import { AlertIcon } from '@/components/shell-icons';

/**
 * Route-level xato holati (`app/**\/error.tsx` uchun umumiy ko'rinish) —
 * docs/design/README.md: "Xato holati: .imk-error + Qayta urinish" MAJBURIY talabini
 * bajaradi. Next.js har bir segmentga o'z `error.tsx`'ini talab qiladi, shu
 * sabab bitta klient komponent yig'ilib, har joyda import qilinadi.
 */
export function RouteErrorState({
  reset,
  title = 'Sahifa yuklanmadi',
  message = "Kutilmagan xatolik yuz berdi. Internetni tekshirib, qayta urinib ko'ring.",
}: {
  reset: () => void;
  title?: string;
  message?: string;
}) {
  return (
    <div className="relative mx-auto max-w-2xl px-4 py-10">
      <div className="imk-error">
        <span className="imk-error__icon">
          <AlertIcon width={22} height={22} aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-lg font-bold text-ink">{title}</h1>
          <p className="font-sans text-base text-ink-soft">{message}</p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="min-h-touch rounded-full bg-primary px-5 font-sans text-base font-semibold text-primary-fg hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          Qayta urinish
        </button>
      </div>
    </div>
  );
}
