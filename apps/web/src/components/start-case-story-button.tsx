'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@imkon/ui';

export function StartCaseStoryButton({ portfolioItemId }: { portfolioItemId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/case-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolio_item_id: portfolioItemId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          res.status === 429
            ? "Kunlik AI limiti tugadi. Ertaga qayta urinib ko'ring."
            : (data.detail ?? 'Boshlashda xatolik yuz berdi.'),
        );
        return;
      }
      router.push(`/portfolio-hikoyasi/${data.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="outline" size="sm" disabled={loading} onClick={start}>
        {loading ? 'Boshlanmoqda…' : "Ziyo bilan birga yozish"}
      </Button>
      {error && (
        <p role="alert" className="font-sans text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
