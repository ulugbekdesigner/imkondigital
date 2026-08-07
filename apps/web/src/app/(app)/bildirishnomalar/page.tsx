import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getMe } from '@/lib/server-api';
import { getMyNotifications } from '@/lib/notifications-api';
import { NotificationsList } from '@/components/notifications-list';
import { BellIcon } from '@/components/shell-icons';
import { formatRelativeTime } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Bildirishnomalar',
  robots: { index: false },
};

export default async function NotificationsPage() {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/bildirishnomalar');

  const { items, unread_count } = await getMyNotifications();
  // Nisbiy vaqt ("2 soat oldin") shu yerda, server komponentida hisoblanadi —
  // NotificationsList 'use client' bo'lgani uchun klientda qayta hisoblash
  // hydration nomosligiga olib kelishi mumkin edi (lib/format.ts izohiga qarang).
  const itemsWithTime = items.map((n) => ({ ...n, relative_time: formatRelativeTime(n.created_at) }));

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-bright/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 py-10">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint text-primary">
            <BellIcon />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Bildirishnomalar</h1>
            <p className="mt-1 font-sans text-base text-ink-soft">
              {unread_count > 0
                ? `${unread_count} ta o'qilmagan xabar bor`
                : "Barcha bildirishnomalar o'qilgan"}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <NotificationsList initialItems={itemsWithTime} />
        </div>
      </div>
    </div>
  );
}
