'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@imkon/ui';
import { CheckIcon } from '@/components/shell-icons';

export function ApplyToProgramButton({ programId }: { programId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function apply() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/programs/${programId}/apply`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(
          res.status === 403
            ? "Ariza berish uchun tasdiqlangan nogironlik profili kerak."
            : res.status === 409
              ? "Siz bu dasturga allaqachon ariza bergansiz."
              : (data.detail ?? "Ariza yuborishda xatolik yuz berdi."),
        );
        return;
      }
      setDone(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p
        className="flex items-center gap-1.5 font-sans text-base"
        style={{ color: 'var(--land-text-on-light)' }}
      >
        <CheckIcon width={16} height={16} className="shrink-0 text-primary" />
        Ariza yuborildi
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Button size="sm" disabled={loading} onClick={apply}>
        {loading ? 'Yuborilmoqda…' : 'Ariza berish'}
      </Button>
      {error && (
        <p role="alert" className="font-sans text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}
