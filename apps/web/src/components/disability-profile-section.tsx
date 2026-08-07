'use client';

import { useEffect, useState } from 'react';
import { DisabilityForm } from '@/components/disability-form';
import { AlertIcon, ArrowLeftIcon, CheckIcon, LockIcon } from '@/components/shell-icons';

const SUMMARY: Record<
  string,
  { icon: typeof CheckIcon; iconBg: string; iconFg: string; title: string; subtitle: string }
> = {
  verified: {
    icon: CheckIcon,
    iconBg: 'bg-success-bg',
    iconFg: 'text-success',
    title: 'Moderator tomonidan tasdiqlangan',
    subtitle: "Faqat siz ruxsat bergan ish beruvchi ko'radi",
  },
  pending: {
    icon: LockIcon,
    iconBg: 'bg-surface-2',
    iconFg: 'text-ink-soft',
    title: 'Tekshiruvda',
    subtitle: "Moderator ko'rib chiqmoqda — odatda 1-2 kun ichida",
  },
  rejected: {
    icon: AlertIcon,
    iconBg: 'bg-error-bg',
    iconFg: 'text-error',
    title: 'Rad etilgan',
    subtitle: "Ma'lumotni qayta ko'rib chiqib qayta yuboring",
  },
};

/** Nogironlik profili — tasdiqlangan/tekshiruvda bo'lsa qisqacha xulosa, "O'zgartirish" bilan ochiladi. */
export function DisabilityProfileSection({
  verifiedStatus,
  rejectionReason,
  docUrl,
}: {
  verifiedStatus: string | null;
  rejectionReason: string | null;
  docUrl: string | null;
}) {
  const summary = verifiedStatus ? SUMMARY[verifiedStatus] : undefined;
  const [expanded, setExpanded] = useState(!summary);

  // verifiedStatus router.refresh() orqali yangilanganda (masalan, forma
  // birinchi marta yuborilgach) xulosaga avtomatik qaytish uchun.
  useEffect(() => {
    setExpanded(!summary);
  }, [summary]);

  if (!summary || expanded) {
    return (
      <div className="flex flex-col gap-3">
        {summary && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="inline-flex min-h-touch items-center gap-1.5 self-start font-sans text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <ArrowLeftIcon width={14} height={14} aria-hidden="true" />
            Xulosaga qaytish
          </button>
        )}
        <DisabilityForm verifiedStatus={verifiedStatus} docUrl={docUrl} />
      </div>
    );
  }

  const Icon = summary.icon;
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-surface-2 p-4">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl ${summary.iconBg} ${summary.iconFg}`}
          aria-hidden="true"
        >
          <Icon width={18} height={18} />
        </span>
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="font-sans text-base font-semibold text-ink">{summary.title}</span>
          <span className="font-sans text-xs text-ink-soft">{summary.subtitle}</span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="font-sans text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          O'zgartirish
        </button>
      </div>
      {verifiedStatus === 'rejected' && rejectionReason && (
        <p className="rounded-xl bg-error-bg p-3 font-sans text-sm text-error">
          <strong>Moderator izohi:</strong> {rejectionReason}
        </p>
      )}
    </div>
  );
}
