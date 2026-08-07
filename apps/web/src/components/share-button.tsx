'use client';

import { useState } from 'react';
import { ShareIcon, CheckIcon } from '@/components/shell-icons';

/** Real Web Share API (mobil brauzerlarda tizim ulashish oynasi); qo'llamasa
 * havolani buferga nusxalaydi — soxta ulashish yo'q, ikkalasi ham haqiqiy amal. */
export function ShareButton({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // Foydalanuvchi ulashishni bekor qildi — xatolik emas
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={share}
      className={
        className ??
        'flex min-h-touch flex-1 items-center justify-center gap-2 rounded-full border border-line px-4 font-sans text-base font-semibold text-ink hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2'
      }
    >
      {copied ? (
        <>
          <CheckIcon width={16} height={16} className="shrink-0 text-primary" />
          Nusxalandi
        </>
      ) : (
        <>
          <ShareIcon width={16} height={16} className="shrink-0" />
          Ulashish
        </>
      )}
    </button>
  );
}
