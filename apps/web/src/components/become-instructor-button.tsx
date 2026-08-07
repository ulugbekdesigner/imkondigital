'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@imkon/ui';

export function BecomeInstructorButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/me/become-instructor', { method: 'POST' });
      if (!res.ok) {
        setError('Boshlashda xatolik yuz berdi. Qaytadan urinib ko\'ring.');
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-line bg-paper p-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Ustoz sifatida boshlang</h2>
        <p className="mt-1 font-sans text-base text-ink-soft">
          Kurs yaratish va o'quvchilarga dars berish uchun ustoz maqomiga o'ting — bir tugma bosish
          yetarli, tasdiqlash kutish shart emas.
        </p>
      </div>
      {error && (
        <p role="alert" className="font-sans text-base text-error">
          {error}
        </p>
      )}
      <Button type="button" disabled={loading} onClick={start} className="self-start">
        {loading ? 'Boshlanmoqda…' : 'Ustoz sifatida boshlash'}
      </Button>
    </div>
  );
}
