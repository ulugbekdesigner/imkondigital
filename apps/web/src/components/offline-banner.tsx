'use client';

import { useEffect, useState } from 'react';
import { WifiOffIcon } from '@/components/shell-icons';

/**
 * `navigator.onLine`ga asoslangan halol bildirishnoma — faqat ulanish
 * yo'qligini bildiradi va sahifani qayta yuklaydi. Oflayn darslar/avtomatik
 * sinxronizatsiya kabi da'volar YO'Q — bunday infratuzilma (service worker,
 * oflayn saqlash) loyihada hali mavjud emas.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const handleOffline = () => setOffline(true);
    const handleOnline = () => setOffline(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-[var(--z-toast)] flex flex-wrap items-center justify-center gap-x-3 gap-y-2 bg-deep px-4 py-2.5 text-center"
    >
      <span className="flex items-center gap-2 font-sans text-sm font-medium text-deep-fg">
        <WifiOffIcon width={16} height={16} className="shrink-0" />
        Aloqa yo&apos;q — internet uzildi
      </span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="min-h-touch rounded-full bg-deep-fg px-4 font-sans text-xs font-semibold text-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        Qayta urinish
      </button>
    </div>
  );
}
