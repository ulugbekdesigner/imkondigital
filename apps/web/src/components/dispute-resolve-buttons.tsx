'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@imkon/ui';

export function DisputeResolveButtons({ orderId }: { orderId: number }) {
  const router = useRouter();
  const [resolution, setResolution] = useState('');
  const [loading, setLoading] = useState<'freelancer' | 'client' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resolve(winner: 'freelancer' | 'client') {
    setLoading(winner);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/dispute/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner, resolution: resolution.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(typeof data?.detail === 'string' ? data.detail : 'Nizoni hal qilib bo’lmadi.');
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  const canSubmit = resolution.trim().length >= 3;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`dispute-resolution-${orderId}`} className="font-sans text-sm font-medium text-ink">
        Qaror izohi
      </label>
      <textarea
        id={`dispute-resolution-${orderId}`}
        value={resolution}
        onChange={(e) => setResolution(e.target.value)}
        rows={2}
        placeholder="Ikkala tomon ham ko'radi — nima uchun shu qaror qabul qilindi…"
        className="w-full rounded-lg border border-line bg-paper px-3 py-2 font-sans text-sm text-ink placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      />
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={!canSubmit || loading !== null}
          onClick={() => resolve('freelancer')}
        >
          {loading === 'freelancer' ? 'Yuborilmoqda…' : 'Ijrochi haq'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!canSubmit || loading !== null}
          onClick={() => resolve('client')}
        >
          {loading === 'client' ? 'Yuborilmoqda…' : 'Buyurtmachi haq'}
        </Button>
      </div>
      {error && (
        <p role="alert" className="font-sans text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}
