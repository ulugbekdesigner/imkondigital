'use client';

import { useState } from 'react';
import { Button } from '@imkon/ui';
import { StarIcon } from '@/components/shell-icons';
import type { CourseReviewOut } from '@/lib/types';

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} / 5 yulduz`} className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon
          key={i}
          width={14}
          height={14}
          fill={i < rating ? 'currentColor' : 'none'}
          className={i < rating ? 'text-gold' : 'text-line'}
        />
      ))}
    </span>
  );
}

function ReplyForm({ reviewId, onReplied }: { reviewId: number; onReplied: (reply: string) => void }) {
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/course-reviews/${reviewId}/reply`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply }),
      });
      if (res.ok) onReplied(reply);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-2 flex gap-2">
      <input
        aria-label="Javob yozing"
        placeholder="Javob yozing…"
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        className="min-h-touch flex-1 rounded-full border border-line bg-paper px-4 font-sans text-sm text-ink placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      />
      <Button type="submit" size="sm" variant="outline" disabled={busy || !reply.trim()}>
        Javob berish
      </Button>
    </form>
  );
}

export function CourseReviewsList({
  reviews: initialReviews,
  canReply = false,
}: {
  reviews: (CourseReviewOut & { course_title?: string })[];
  canReply?: boolean;
}) {
  const [reviews, setReviews] = useState(initialReviews);

  if (reviews.length === 0) {
    return (
      <div className="imk-empty">
        <span className="imk-empty__icon" aria-hidden="true">
          <StarIcon width={22} height={22} />
        </span>
        <p className="font-sans text-base font-medium text-ink">Hali sharh yo'q</p>
        <p className="max-w-sm font-sans text-sm text-ink-soft">
          O'quvchilar kursni baholaganda sharhlar shu yerda ko'rinadi.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {reviews.map((r) => (
        <li key={r.id} className="rounded-xl border border-line bg-paper p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-sans text-sm font-medium text-ink">{r.reviewer_name}</span>
              {r.course_title && (
                <span className="ml-2 font-sans text-xs text-ink-soft">— {r.course_title}</span>
              )}
            </div>
            <Stars rating={r.rating} />
          </div>
          {r.comment && <p className="mt-1 font-sans text-sm text-ink-soft">{r.comment}</p>}
          {r.instructor_reply ? (
            <p className="mt-2 rounded-lg bg-mint p-3 font-sans text-sm text-ink">
              Ustoz javobi: {r.instructor_reply}
            </p>
          ) : (
            canReply && (
              <ReplyForm
                reviewId={r.id}
                onReplied={(reply) =>
                  setReviews((prev) =>
                    prev.map((p) => (p.id === r.id ? { ...p, instructor_reply: reply } : p)),
                  )
                }
              />
            )
          )}
        </li>
      ))}
    </ul>
  );
}
