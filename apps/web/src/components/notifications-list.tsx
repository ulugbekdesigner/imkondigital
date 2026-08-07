'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants, cn } from '@imkon/ui';
import { BellIcon, CheckIcon } from '@/components/shell-icons';
import { EmptyState } from '@/components/state-panels';
import { useToast } from '@/components/toast';
import type { NotificationCategory, NotificationOut } from '@/lib/types';

type NotificationWithTime = NotificationOut & { relative_time: string };

const TYPE_LABEL: Record<string, string> = {
  application_status: 'Ariza',
  order_status: 'Buyurtma',
  order_message: 'Xabar',
  certificate_issued: 'Sertifikat',
  mentorship: 'Mentorlik',
  instructor_message: 'Ustozdan xabar',
  benefit_match: 'Imtiyoz',
  assignment_reviewed: 'Topshiriq',
  student_placed: 'Ishga joylashuv',
  system: 'Tizim',
};

const TABS: { key: NotificationCategory; label: string }[] = [
  { key: 'learning', label: "Mening o'qishim" },
  { key: 'opportunity', label: 'Imkoniyatlar' },
  { key: 'government', label: 'Davlat yangiliklari' },
];

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper';

export function NotificationsList({ initialItems }: { initialItems: NotificationWithTime[] }) {
  const showToast = useToast();
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);
  // Birinchi o'qilmagan xabar bor toifa tanlanadi — aks holda foydalanuvchi
  // "O'qilmagan N ta" ko'rib, bo'sh tabga tushib qolishi mumkin edi.
  const [tab, setTab] = useState<NotificationCategory>(
    () => TABS.find((t) => initialItems.some((n) => n.category === t.key && !n.read_at))?.key ?? 'learning',
  );

  async function markRead(id: number) {
    // Optimistik yangilanish — foydalanuvchi havolaga bosib ketganda ham
    // holat darhol o'zgaradi. Server rad etsa, orqaga qaytariladi va xato
    // toast bilan bildiriladi (jim yutib yuborilmaydi).
    const previous = items;
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
    );
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      if (!res.ok) throw new Error('mark-read-failed');
    } catch {
      setItems(previous);
      showToast({
        variant: 'error',
        title: "Bildirishnomani belgilab bo'lmadi",
        body: "Internetni tekshirib, qayta urinib ko'ring.",
      });
    }
  }

  async function markAllRead() {
    setLoading(true);
    const previous = items;
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'POST' });
      if (!res.ok) throw new Error('mark-all-read-failed');
      setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
      showToast({ variant: 'success', title: "Barchasi o'qilgan deb belgilandi" });
    } catch {
      setItems(previous);
      showToast({
        variant: 'error',
        title: 'Xatolik yuz berdi',
        body: "Birozdan so'ng qayta urinib ko'ring.",
      });
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<BellIcon width={22} height={22} />}
        title="Hali bildirishnoma yo'q"
        description="Kurs, ariza yoki imtiyoz bo'yicha yangilik bo'lganda shu yerda ko'rinadi."
        action={
          <Link href="/qidiruv" className={cn(buttonVariants({ size: 'md' }), 'mt-1 text-sm')}>
            Imkoniyatlarni qidirish
          </Link>
        }
      />
    );
  }

  const tabItems = items.filter((n) => n.category === tab);
  const totalUnread = items.filter((n) => !n.read_at).length;

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Bildirishnoma toifalari"
        className="flex flex-wrap gap-1 border-b border-line"
      >
        {TABS.map((t) => {
          const unread = items.filter((n) => n.category === t.key && !n.read_at).length;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`flex min-h-touch items-center gap-2 rounded-t-md border-b-2 px-3 py-2 font-sans text-sm font-medium ${FOCUS_RING} ${
                tab === t.key
                  ? 'border-primary text-ink'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              {t.label}
              {unread > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 font-mono text-xs text-primary-fg">
                  {unread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {totalUnread > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" isLoading={loading} onClick={markAllRead}>
            {!loading && <CheckIcon width={16} height={16} />}
            Barchasini o'qilgan deb belgilash
          </Button>
        </div>
      )}

      {tabItems.length === 0 ? (
        <EmptyState
          icon={<BellIcon width={20} height={20} />}
          title="Bu toifada hali bildirishnoma yo'q"
          description="Boshqa bo'limni tanlang yoki keyinroq qayta tekshiring."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {tabItems.map((n) => {
            const unread = !n.read_at;
            const content = (
              <div
                className={`flex flex-col gap-1 rounded-lg border border-line bg-paper p-4 transition-colors duration-fast ${
                  unread ? 'border-l-4 border-l-info' : 'hover:border-ink-soft'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-ink-soft">
                    {unread && (
                      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-info" />
                    )}
                    {TYPE_LABEL[n.type] ?? n.type}
                  </span>
                  <span className="font-mono text-xs text-ink-soft">{n.relative_time}</span>
                </div>
                <p className={`font-sans text-base text-ink ${unread ? 'font-semibold' : 'font-medium'}`}>
                  {n.title}
                </p>
                {n.body && <p className="font-sans text-base text-ink-soft">{n.body}</p>}
              </div>
            );

            return (
              <li key={n.id}>
                {n.link_url ? (
                  <Link
                    href={n.link_url}
                    onClick={() => unread && markRead(n.id)}
                    className={`block rounded-lg ${FOCUS_RING}`}
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={`block w-full rounded-lg text-left ${FOCUS_RING}`}
                    onClick={() => unread && markRead(n.id)}
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
