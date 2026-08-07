'use client';

import { useState } from 'react';
import { Button } from '@imkon/ui';
import { AlertIcon, CheckIcon, LinkIcon } from '@/components/shell-icons';
import type { TelegramLinkCodeOut } from '@/lib/types';

type RetryAction = 'requestCode' | 'checkStatus';

export function TelegramLinkPanel({ initiallyLinked }: { initiallyLinked: boolean }) {
  const [linked, setLinked] = useState(initiallyLinked);
  const [linkInfo, setLinkInfo] = useState<TelegramLinkCodeOut | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAction, setRetryAction] = useState<RetryAction | null>(null);

  async function requestCode() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/telegram/link-code', { method: 'POST' });
      if (!res.ok) {
        setError('Havola olishda xatolik yuz berdi. Birozdan so‘ng qayta urinib ko‘ring.');
        setRetryAction('requestCode');
        return;
      }
      setLinkInfo((await res.json()) as TelegramLinkCodeOut);
    } catch {
      setError('Havola olishda xatolik yuz berdi. Birozdan so‘ng qayta urinib ko‘ring.');
      setRetryAction('requestCode');
    } finally {
      setLoading(false);
    }
  }

  async function checkStatus() {
    setChecking(true);
    setError(null);
    try {
      const res = await fetch('/api/telegram/status');
      if (!res.ok) {
        setError('Holatni tekshirishda xatolik yuz berdi. Birozdan so‘ng qayta urinib ko‘ring.');
        setRetryAction('checkStatus');
        return;
      }
      const data = (await res.json()) as { linked: boolean };
      setLinked(data.linked);
      if (data.linked) setLinkInfo(null);
    } catch {
      setError('Holatni tekshirishda xatolik yuz berdi. Birozdan so‘ng qayta urinib ko‘ring.');
      setRetryAction('checkStatus');
    } finally {
      setChecking(false);
    }
  }

  function retry() {
    if (retryAction === 'requestCode') void requestCode();
    else if (retryAction === 'checkStatus') void checkStatus();
  }

  const errorNotice = error && (
    <div role="alert" className="imk-error w-full">
      <span className="imk-error__icon" aria-hidden="true">
        <AlertIcon width={22} height={22} />
      </span>
      <div>
        <p className="font-sans text-base text-ink">{error}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        isLoading={loading || checking}
        onClick={retry}
      >
        Qayta urinish
      </Button>
    </div>
  );

  if (linked) {
    return (
      <p className="flex items-start gap-1.5 rounded-lg border border-line bg-mint p-4 font-sans text-base text-ink">
        <CheckIcon width={16} height={16} className="mt-0.5 shrink-0 text-primary" />
        <span>
          Telegram bog'landi — endi ariza, buyurtma va sertifikat yangilanishlari bot orqali ham
          keladi.
        </span>
      </p>
    );
  }

  if (linkInfo) {
    const deepLink = `https://t.me/${linkInfo.bot_username}?start=${linkInfo.code}`;
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-line bg-paper p-4">
        <p className="font-sans text-base text-ink">
          Quyidagi havolani oching va botda "Start" tugmasini bosing ({linkInfo.expires_in_minutes}{' '}
          daqiqa amal qiladi):
        </p>
        <a
          href={deepLink}
          target="_blank"
          rel="noreferrer"
          className="font-sans text-base text-primary underline-offset-4 hover:underline"
        >
          {deepLink}
        </a>
        <Button
          variant="outline"
          isLoading={checking}
          onClick={checkStatus}
          className="self-start"
        >
          {checking ? 'Tekshirilmoqda…' : "Bog'landimi, tekshirish"}
        </Button>
        {errorNotice}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button isLoading={loading} onClick={requestCode}>
        {!loading && <LinkIcon width={16} height={16} />}
        {loading ? 'Tayyorlanmoqda…' : "Telegram bog'lash"}
      </Button>
      {errorNotice}
    </div>
  );
}
