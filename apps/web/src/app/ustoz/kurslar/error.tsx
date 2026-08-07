'use client';

import { useEffect } from 'react';
import { buttonVariants, cn } from '@imkon/ui';
import { AlertIcon, RefreshIcon } from '@/components/shell-icons';

/** Ustoz kabineti ichidagi (dashboard/kurslar/topshiriqlar/o'quvchilar/
 * sharhlar/sozlamalar/jonli darslar/baholash/kurs konstruktori) umumiy xato
 * holati — docs/design/README.md majburiy holat qoidasi (.imk-error + "Qayta urinish").
 * CabinetShell (sidebar+topbar) layout.tsx orqali darhol chizilib bo'ladi,
 * faqat {children} maydoni shu xato ko'rinishi bilan almashadi — foydalanuvchi
 * navigatsiyani yo'qotmaydi. */
export default function UstozKurslarError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-3xl">
      <div className="imk-error" role="alert">
        <span aria-hidden="true" className="imk-error__icon">
          <AlertIcon width={22} height={22} />
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-sans text-base font-bold text-ink">Sahifani yuklab bo&apos;lmadi</p>
          <p className="font-sans text-sm text-ink-soft">
            Internet aloqasi yoki serverda vaqtinchalik muammo bo&apos;lishi mumkin.
          </p>
        </div>
        <button type="button" onClick={reset} className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}>
          <RefreshIcon width={16} height={16} aria-hidden="true" />
          Qayta urinish
        </button>
      </div>
    </div>
  );
}
