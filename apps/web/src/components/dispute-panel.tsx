'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@imkon/ui';

const DISPUTABLE_STATUSES = new Set(['funded', 'in_progress', 'delivered']);

export function DisputePanel({ orderId, status }: { orderId: number; status: string }) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  if (status === 'disputed') {
    return (
      <p className="rounded-lg border border-line bg-mint p-4 font-sans text-base text-ink">
        Nizo ochilgan — moderator ko'rib chiqmoqda. Natija haqida xabar beramiz.
      </p>
    );
  }

  if (!DISPUTABLE_STATUSES.has(status)) return null;

  if (!open) {
    return (
      <Button variant="ghost" className="text-error hover:bg-error/10" onClick={() => setOpen(true)}>
        Nizo ochish
      </Button>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? 'Nizo ochishda xatolik yuz berdi.');
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-error/40 bg-error/5 p-4"
    >
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-base font-medium text-ink">Nizo sababi</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          minLength={5}
          required
          className="w-full rounded border border-line bg-paper px-3 py-2 font-sans text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        />
      </label>
      {error && (
        <p role="alert" className="font-sans text-base text-error">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" variant="danger" isLoading={loading}>
          Nizoni yuborish
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Bekor qilish
        </Button>
      </div>
    </form>
  );
}
