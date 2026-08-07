import type { ReactNode } from 'react';
import { AlertIcon, LockIcon } from '@/components/shell-icons';
import { RetryButton } from '@/components/retry-button';

/**
 * Sayt bo'ylab bir xil ko'rinishdagi "bo'sh" / "xato" / "yopiq" panellar —
 * docs/design/parts.css standartidagi .imk-empty/.imk-error/.imk-locked
 * klasslaridan foydalanadi (semantik tokenlar orqali uchala mavzuda ham
 * to'g'ri chiqadi). docs/design/README.md: "Har bir ro'yxat/jadval/panelda yuklanmoqda/
 * bo'sh/xato/ruxsat yo'q holatlari bo'lishi SHART".
 */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="imk-empty">
      <span className="imk-empty__icon" aria-hidden="true">
        {icon}
      </span>
      <div>
        <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
        <p className="mt-1 max-w-xl font-sans text-base text-ink-soft">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  title = 'Yuklashda xatolik yuz berdi',
  description = "Internet aloqasi yoki server bilan muammo bo'lishi mumkin. Qayta urinib ko'ring.",
  retryLabel,
}: {
  title?: string;
  description?: string;
  retryLabel?: string;
}) {
  return (
    <div className="imk-error" role="alert">
      <span className="imk-error__icon" aria-hidden="true">
        <AlertIcon width={24} height={24} />
      </span>
      <div>
        <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
        <p className="mt-1 max-w-xl font-sans text-base text-ink-soft">{description}</p>
      </div>
      <RetryButton label={retryLabel} />
    </div>
  );
}

export function LockedState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="imk-locked">
      <LockIcon width={22} height={22} aria-hidden="true" />
      <div>
        <p className="font-sans text-base font-semibold">{title}</p>
        <p className="font-sans text-sm">{description}</p>
      </div>
    </div>
  );
}
