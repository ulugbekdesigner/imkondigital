'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@imkon/ui';

export function CourseDecisionButtons({ courseId }: { courseId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean, rejectReason?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve, reason: rejectReason ?? null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(typeof data?.detail === 'string' ? data.detail : 'Qarorni saqlab bo’lmadi.');
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (rejecting) {
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={`course-reject-reason-${courseId}`} className="font-sans text-sm font-medium text-ink">
          Rad etish sababi
        </label>
        <textarea
          id={`course-reject-reason-${courseId}`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Ustoz buni ko'radi va tuzatib qayta yuborishi mumkin…"
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
        {error && (
          <p role="alert" className="font-sans text-xs text-error">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <Button size="sm" disabled={loading} onClick={() => decide(true)}>
          Nashr
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
      {error && (
        <p role="alert" className="font-sans text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}
