'use client';

import { useState } from 'react';
import { Button } from '@imkon/ui';
import { CheckIcon } from '@/components/shell-icons';

export function ReviewForm({ orderId }: { orderId: number }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  if (alreadyReviewed) {
    return (
      <p className="rounded-lg border border-line bg-mint p-4 font-sans text-base text-ink">
        Siz allaqachon sharh qoldirgansiz. Rahmat!
      </p>
    );
  }

  if (done) {
    return (
      <p className="flex items-center gap-1.5 rounded-lg border border-line bg-mint p-4 font-sans text-base font-medium text-ink">
        <CheckIcon width={16} height={16} className="shrink-0 text-primary" />
        Sharhingiz uchun rahmat!
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, text }),
      });
      if (res.status === 409) {
        setAlreadyReviewed(true);
        return;
      }
      if (!res.ok) {
        setError('Sharh qoldirishda xatolik yuz berdi.');
        return;
      }
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-line bg-paper p-4"
    >
      <h2 className="font-display text-lg font-semibold text-ink">Sharh qoldiring</h2>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="font-sans text-base font-medium text-ink">Baho</legend>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={rating === n}
              onClick={() => setRating(n)}
              className={
                'flex min-h-touch min-w-touch items-center justify-center rounded-full font-mono text-base font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 ' +
                (rating >= n ? 'bg-primary text-primary-fg' : 'bg-mint text-ink')
              }
            >
              {n}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-base font-medium text-ink">Izoh</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full rounded border border-line bg-paper px-3 py-2 font-sans text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        />
      </label>
      {error && (
        <p role="alert" className="font-sans text-base text-error">
          {error}
        </p>
      )}
      <Button type="submit" isLoading={loading} className="self-start">
        {loading ? 'Yuborilmoqda…' : 'Sharh qoldirish'}
      </Button>
    </form>
  );
}
