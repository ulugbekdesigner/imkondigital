import Link from 'next/link';
import { cn } from '@imkon/ui';
import { BellIcon, BriefcaseIcon, CheckIcon, ChevronRightIcon, HeartIcon } from '@/components/shell-icons';
import { formatRelativeTime } from '@/lib/format';
import type { NotificationCategory, NotificationOut } from '@/lib/types';

const CATEGORY_META: Record<NotificationCategory, { Icon: typeof CheckIcon; iconClass: string }> = {
  learning: { Icon: CheckIcon, iconClass: 'bg-success-bg text-success' },
  opportunity: { Icon: BriefcaseIcon, iconClass: 'bg-info-bg text-info' },
  government: { Icon: HeartIcon, iconClass: 'bg-warn-bg text-warn' },
};

export function NotificationsPreviewCard({
  items,
  unreadCount,
}: {
  items: NotificationOut[];
  unreadCount: number;
}) {
  const preview = items.slice(0, 3);
  return (
    <div className="flex flex-1 flex-col gap-3 rounded-xl border border-line bg-paper p-[22px]">
      <div className="flex items-center justify-between">
        <span className="font-display text-md font-bold text-ink">Bildirishnomalar</span>
        {unreadCount > 0 && (
          <span className="rounded-full bg-error-bg px-2.5 py-1 font-sans text-xs font-semibold text-error">
            {unreadCount} yangi
          </span>
        )}
      </div>
      {preview.length === 0 ? (
        <div className="imk-empty">
          <span aria-hidden="true" className="imk-empty__icon">
            <BellIcon width={20} height={20} />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-sans text-sm font-bold text-ink">Hali bildirishnoma yo&apos;q</p>
            <p className="font-sans text-sm text-ink-soft">
              Kurslar va arizalaringiz haqidagi yangiliklar shu yerda paydo bo&apos;ladi.
            </p>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col">
          {preview.map((n, i) => {
            const meta = CATEGORY_META[n.category];
            return (
              <li
                key={n.id}
                className={cn(
                  'flex min-w-0 gap-3 py-3',
                  i < preview.length - 1 && 'border-b border-surface-2',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn('flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl', meta.iconClass)}
                >
                  <meta.Icon width={18} height={18} />
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-sans text-sm font-semibold text-ink">{n.title}</span>
                  <span className="truncate font-sans text-xs text-ink-soft">
                    {n.body ? `${n.body} · ` : ''}
                    {formatRelativeTime(n.created_at)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Link
        href="/bildirishnomalar"
        className="mt-auto inline-flex items-center gap-0.5 font-sans text-sm font-semibold text-primary underline-offset-4 hover:underline"
      >
        Barchasini ko&apos;rish
        <ChevronRightIcon width={14} height={14} aria-hidden="true" />
      </Link>
    </div>
  );
}
