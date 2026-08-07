'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@imkon/ui';

export function ModerationDecisionButtons({ userId }: { userId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  async function decide(approve: boolean, rejectReason?: string) {
    setLoading(true);
    try {
      await fetch(`/api/moderation/disability-profiles/${userId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve, reason: rejectReason ?? null }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (rejecting) {
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={`reject-reason-${userId}`} className="font-sans text-sm font-medium text-ink">
          Rad etish sababi
        </label>
        <textarea
          id={`reject-reason-${userId}`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Foydalanuvchi buni ko'radi va tuzatib qayta yuborishi mumkin…"
          className="w-full rounded-lg border border-line bg-paper px-3 py-2 font-sans text-sm text-ink placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-error text-error-fg hover:brightness-110"
            disabled={loading || !reason.trim()}
            onClick={() => decide(false, reason.trim())}
          >
            {loading ? 'Yuborilmoqda…' : 'Rad etishni tasdiqlash'}
          </Button>
          <Button variant="ghost" size="sm" disabled={loading} onClick={() => setRejecting(false)}>
            Bekor qilish
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={loading} onClick={() => decide(true)}>
        Tasdiqlash
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-error hover:bg-error/10"
        disabled={loading}
        onClick={() => setRejecting(true)}
      >
        Rad · sabab bilan
      </Button>
    </div>
  );
}
