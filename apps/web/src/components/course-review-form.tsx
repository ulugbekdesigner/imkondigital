'use client';

import { useState } from 'react';
import { Button } from '@imkon/ui';
import { StarIcon } from '@/components/shell-icons';

export function CourseReviewForm({ courseId }: { courseId: number }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? 'Xatolik yuz berdi.');
        return;
      }
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return <p className="font-sans text-sm text-primary">Sharhingiz uchun rahmat!</p>;
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl border border-line bg-paper p-4">
      <fieldset className="flex items-center gap-1">
        <legend className="mb-1 font-sans text-sm text-ink-soft">Bahoingiz</legend>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} yulduz`}
            aria-pressed={rating === n}
            className="flex min-h-touch min-w-touch items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            <StarIcon
              width={20}
              height={20}
              fill={n <= rating ? 'currentColor' : 'none'}
              className={n <= rating ? 'text-gold' : 'text-line'}
            />
          </button>
        ))}
      </fieldset>
      <label htmlFor={`review-comment-${courseId}`} className="sr-only">
        Fikringiz
      </label>
      <textarea
        id={`review-comment-${courseId}`}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Fikringiz (ixtiyoriy)…"
        className="w-full rounded-lg border border-line bg-paper px-3 py-2 font-sans text-sm text-ink placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      />
      {error && (
        <p role="alert" className="font-sans text-sm text-error">
          {error}
        </p>
      )}
      <Button type="submit" variant="outline" size="sm" disabled={busy} className="self-start">
        {busy ? 'Yuborilmoqda…' : 'Sharh qoldirish'}
      </Button>
    </form>
  );
}
