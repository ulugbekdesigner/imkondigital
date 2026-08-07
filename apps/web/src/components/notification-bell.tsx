'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { NotificationOut } from '@/lib/types';

const POLL_INTERVAL_MS = 20000;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<NotificationOut[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  async function refresh() {
    const res = await fetch('/api/notifications').catch(() => null);
    if (res?.ok) {
      const data = (await res.json()) as { items: NotificationOut[]; unread_count: number };
      setItems(data.items.slice(0, 8));
      setUnreadCount(data.unread_count);
    }
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function markRead(id: number) {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    refresh();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Bildirishnomalar${unreadCount > 0 ? `, ${unreadCount} ta o'qilmagan` : ''}`}
        className="relative flex min-h-touch min-w-touch items-center justify-center rounded border border-line text-ink hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 font-mono text-[10px] font-bold text-error-fg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="imk-header-popover absolute right-0 top-full z-[var(--z-drawer)] mt-2 w-80 rounded-lg border border-line bg-paper shadow-sm">
          <div className="flex items-center justify-between border-b border-line px-4 py-2">
            <span className="font-display text-base font-semibold text-ink">Bildirishnomalar</span>
            <Link
              href="/bildirishnomalar"
              onClick={() => setOpen(false)}
              className="font-sans text-xs text-primary underline-offset-4 hover:underline"
            >
              Barchasi
            </Link>
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {items.length === 0 && (
              <li className="px-4 py-3 font-sans text-base text-ink-soft">Hali xabar yo'q.</li>
            )}
            {items.map((n) => (
              <li key={n.id} className="border-b border-line last:border-0">
                <button
                  type="button"
                  onClick={() => {
                    if (!n.read_at) markRead(n.id);
                  }}
                  className={`flex w-full flex-col gap-0.5 px-4 py-2.5 text-left hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset ${n.read_at ? '' : 'bg-mint/40'}`}
                >
                  <span className="font-sans text-base font-medium text-ink">{n.title}</span>
                  {n.body && (
                    <span className="font-sans text-xs text-ink-soft line-clamp-2">{n.body}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
