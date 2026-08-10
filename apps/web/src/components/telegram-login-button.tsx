'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@imkon/ui';

type Status = 'idle' | 'waiting' | 'error';

function redirectForRoles(roles: string[]): string {
  if (roles.includes('admin')) return '/admin';
  if (roles.includes('instructor')) return '/ustoz/kurslar';
  return '/mening-yolim';
}

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000; // 5 daqiqa - undan uzoq kutish shart emas

/**
 * Tezkor Auth (markazlashgan Telegram-orqali kirish, @tezkortasdiqbot) tugmasi.
 * Parol-asosli LoginForm'ni ALMASHTIRMAYDI - qo'shimcha, tezroq variant.
 */
export function TelegramLoginButton() {
  const router = useRouter();
  const params = useSearchParams();
  const explicitNext = params.get('next');

  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);

  useEffect(
    () => () => {
      cancelledRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  function fail(message: string) {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('error');
    setError(message);
  }

  async function start() {
    setStatus('waiting');
    setError(null);
    try {
      const res = await fetch('/api/auth/telegram/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ return_url: window.location.href }),
      });
      if (!res.ok) {
        fail("Telegram orqali kirishni boshlab bo'lmadi. Birozdan so'ng qayta urinib ko'ring.");
        return;
      }
      const data = await res.json();
      if (data.deep_link) window.open(data.deep_link, '_blank', 'noopener,noreferrer');

      const startedAt = Date.now();
      timerRef.current = setInterval(async () => {
        if (cancelledRef.current) return;
        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          fail("Vaqt tugadi — qaytadan urinib ko'ring.");
          return;
        }
        const s = await fetch(`/api/auth/telegram/status/${data.session_id}`)
          .then((r) => r.json())
          .catch(() => null);
        if (cancelledRef.current || !s) return;

        if (s.status === 'confirmed') {
          if (timerRef.current) clearInterval(timerRef.current);
          const finishRes = await fetch(`/api/auth/telegram/finish/${data.session_id}`, {
            method: 'POST',
          });
          if (!finishRes.ok) {
            fail("Kirishni yakunlab bo'lmadi. Qayta urinib ko'ring.");
            return;
          }
          let next = explicitNext;
          if (!next) {
            const meRes = await fetch('/api/me');
            const me = meRes.ok ? await meRes.json() : null;
            next = redirectForRoles(me?.roles ?? []);
          }
          router.push(next);
          router.refresh();
        } else if (s.status === 'rejected' || s.status === 'expired') {
          fail(s.status === 'rejected' ? 'Kirish rad etildi.' : 'Sessiya muddati tugadi.');
        }
      }, POLL_INTERVAL_MS);
    } catch {
      fail('Xatolik yuz berdi. Qayta urinib ko\'ring.');
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={status === 'waiting'}
        onClick={start}
      >
        {status === 'waiting' ? 'Telegramda tasdiqlang…' : 'Telegram bilan kirish'}
      </Button>
      {error && (
        <p role="alert" className="font-sans text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
