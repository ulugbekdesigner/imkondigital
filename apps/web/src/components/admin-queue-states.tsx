/* ============================================================
   IMKON DIGITAL — Admin navbat holatlari
   /admin bosh sahifasidagi har bir navbat (nogironlik, kurs, nizo)
   uchun bir xil "bo'sh" / "xato" / "ruxsat yo'q" ko'rinishi —
   docs/design/parts.css standartidan (.imk-empty/.imk-error/.imk-locked),
   docs/design/README.md "har sahifada majburiy" ro'yxati.
   ============================================================ */
import type { ComponentType, ReactNode, SVGProps } from 'react';
import Link from 'next/link';
import { AlertIcon, CheckIcon, LockIcon, RefreshIcon } from '@/components/shell-icons';

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export function QueueEmpty({
  Icon = CheckIcon,
  title,
  message,
  ctaHref = '/admin',
  ctaLabel = 'Yangilash',
}: {
  Icon?: IconType;
  title: string;
  message: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="imk-empty">
      <span className="imk-empty__icon" aria-hidden="true">
        <Icon width={22} height={22} />
      </span>
      <div>
        <p className="font-sans text-base font-bold text-ink">{title}</p>
        <p className="font-sans text-sm text-ink-soft">{message}</p>
      </div>
      <Link
        href={ctaHref}
        className="inline-flex min-h-touch items-center gap-1.5 font-sans text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        <RefreshIcon width={14} height={14} aria-hidden="true" />
        {ctaLabel}
      </Link>
    </div>
  );
}

export function QueueError({
  title,
  retryHref = '/admin',
}: {
  title: string;
  retryHref?: string;
}) {
  return (
    <div className="imk-error" role="alert">
      <span className="imk-error__icon" aria-hidden="true">
        <AlertIcon width={22} height={22} />
      </span>
      <div>
        <p className="font-sans text-base font-bold text-ink">{title}</p>
        <p className="font-sans text-sm text-ink-soft">
          Server bilan bog&apos;lanishda xatolik yuz berdi — ma&apos;lumot yuklanmadi.
        </p>
      </div>
      <Link
        href={retryHref}
        className="inline-flex min-h-touch items-center gap-1.5 font-sans text-sm font-semibold text-error underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        Qayta urinish
      </Link>
    </div>
  );
}

export function LockedNotice({ children }: { children: ReactNode }) {
  return (
    <div className="imk-locked">
      <LockIcon width={20} height={20} className="shrink-0" aria-hidden="true" />
      <p className="font-sans text-sm">{children}</p>
    </div>
  );
}
