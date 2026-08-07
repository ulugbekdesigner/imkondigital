'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, ConfirmDialog } from '@imkon/ui';

export function OrderActions({
  orderId,
  status,
  isClient,
  isFreelancer,
}: {
  orderId: number;
  status: string;
  isClient: boolean;
  isFreelancer: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [acceptConfirmOpen, setAcceptConfirmOpen] = useState(false);

  async function post(path: string, body?: unknown) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/${path}`, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? 'Amalni bajarishda xatolik yuz berdi.');
        return;
      }
      setAcceptConfirmOpen(false);
      setCancelConfirmOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const actions: React.ReactNode[] = [];

  if (isFreelancer && status === 'funded') {
    actions.push(
      <Button key="start" isLoading={loading} onClick={() => post('start')}>
        Ishni boshlash
      </Button>,
    );
  }

  if (isFreelancer && status === 'in_progress') {
    actions.push(
      <form
        key="deliver"
        onSubmit={(e) => {
          e.preventDefault();
          post('deliver', { note, file_url: fileUrl || null });
        }}
        className="flex w-full flex-col gap-3"
      >
        <label className="flex flex-col gap-1.5">
          <span className="font-sans text-base font-medium text-ink">Izoh</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full rounded border border-line bg-paper px-3 py-2 font-sans text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-sans text-base font-medium text-ink">Fayl havolasi (ixtiyoriy)</span>
          <input
            type="url"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            className="min-h-touch w-full rounded border border-line bg-paper px-3 font-sans text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          />
        </label>
        <Button type="submit" isLoading={loading} className="self-start">
          Ishni topshirish
        </Button>
      </form>,
    );
  }

  if (isClient && status === 'delivered') {
    actions.push(
      <Button key="accept" onClick={() => setAcceptConfirmOpen(true)}>
        Qabul qilish va to'lovni chiqarish
      </Button>,
    );
  }

  if (isClient && status === 'created') {
    actions.push(
      <Button
        key="cancel"
        variant="ghost"
        className="text-error hover:bg-error/10"
        onClick={() => setCancelConfirmOpen(true)}
      >
        Bekor qilish
      </Button>,
    );
  }

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-paper p-4">
      {actions}
      {error && (
        <p role="alert" className="font-sans text-base text-error">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={acceptConfirmOpen}
        onClose={() => setAcceptConfirmOpen(false)}
        onConfirm={() => post('accept')}
        title="Ishni qabul qilasizmi?"
        description="Mablag' darhol freelancerga chiqariladi. Bu amalni bekor qilib bo'lmaydi."
        confirmLabel="Qabul qilish"
        confirmLoading={loading}
      />
      <ConfirmDialog
        open={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        onConfirm={() => post('cancel')}
        title="Buyurtmani bekor qilasizmi?"
        description="Buyurtma butunlay bekor qilinadi. Bu amalni bekor qilib bo'lmaydi."
        confirmLabel="Bekor qilish"
        confirmLoading={loading}
        destructive
      />
    </div>
  );
}
