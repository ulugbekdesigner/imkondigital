'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, ConfirmDialog } from '@imkon/ui';
import { AlertIcon } from '@/components/shell-icons';

/** Hisobni yopish — /api/me/deactivate orqali backend'da status
 * 'blocked'ga o'tadi (barcha qurilmalardagi sessiyalar bekor bo'ladi),
 * shu yerda esa foydalanuvchi bosh sahifaga chiqariladi. Qayta tiklash
 * faqat admin orqali — ataylab shunday (tasodifiy bosishdan himoya). */
export function AccountDeactivateCard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDeactivate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/me/deactivate', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: null }));
        setError(data.detail ?? 'Hisobni yopishda xatolik yuz berdi.');
        return;
      }
      router.push('/');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--err-line)] bg-[var(--err-soft)] p-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl bg-error-bg text-error"
        >
          <AlertIcon width={18} height={18} />
        </span>
        <div className="flex flex-1 flex-col gap-1">
          <span className="font-sans text-base font-semibold text-ink">Hisobni yopish</span>
          <p className="font-sans text-sm text-ink-soft">
            Hisobingiz bloklanadi va barcha qurilmalardan chiqib ketasiz. Profilingiz, sertifikat va
            portfolio ma&apos;lumotlaringiz saqlanib qoladi — hisobni qayta tiklash uchun{' '}
            <a href="mailto:info@imkondigital.uz" className="underline-offset-4 hover:underline">
              qo&apos;llab-quvvatlashga
            </a>{' '}
            murojaat qiling.
          </p>
        </div>
      </div>
      {error && (
        <p role="alert" className="font-sans text-sm text-error">
          {error}
        </p>
      )}
      <Button
        type="button"
        variant="danger"
        size="sm"
        className="self-start"
        onClick={() => setOpen(true)}
      >
        Hisobni yopish
      </Button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirmDeactivate}
        title="Hisobni yopasizmi?"
        description="Hisobingiz bloklanadi va darhol tizimdan chiqasiz. Buni faqat qo'llab-quvvatlash xizmati qaytara oladi."
        confirmLabel="Ha, yopish"
        confirmLoading={loading}
        destructive
      />
    </div>
  );
}
