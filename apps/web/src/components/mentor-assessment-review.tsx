'use client';

import { useState } from 'react';
import { Button, Radio } from '@imkon/ui';
import { CheckIcon, SparkIcon } from '@/components/shell-icons';
import type { MentorReviewQueueItem } from '@/lib/types';

const VERDICT_OPTIONS: { value: string; label: string; dot: string }[] = [
  { value: 'ready', label: 'Mustaqil ishlashga tayyor', dot: 'bg-primary' },
  { value: 'needs_practice', label: 'Amaliyot kerak', dot: 'bg-warn' },
  { value: 'retake', label: "Kursni qayta ko'rish tavsiya", dot: 'bg-error' },
];

export function MentorAssessmentReview({ item }: { item: MentorReviewQueueItem }) {
  const [verdict, setVerdict] = useState<string>(item.assessment.ai_verdict);
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessments/${item.assessment.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verdict, feedback }),
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
    return (
      <li className="flex items-center gap-3 rounded-lg border border-line bg-mint p-4">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-fg"
        >
          <CheckIcon width={16} height={16} />
        </span>
        <p className="font-sans text-base text-ink">
          {item.student_name} — {item.course_title}: tasdiqlandi.
        </p>
      </li>
    );
  }

  return (
    <li className="rounded-lg border border-line bg-paper p-4">
      <p className="font-sans text-base font-medium text-ink">
        {item.student_name} — {item.course_title}
      </p>
      <div className="mt-2 flex flex-col gap-1 rounded-lg border border-line bg-teal/10 p-3">
        <span className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-wide text-ink-soft">
          <SparkIcon width={14} height={14} aria-hidden="true" className="text-teal" />
          AI dastlabki tahlili
        </span>
        <p className="font-mono text-sm text-ink">Ball: {item.assessment.ai_score_pct}%</p>
        <p className="font-sans text-sm text-ink">{item.assessment.ai_feedback}</p>
      </div>
      <form onSubmit={confirm} className="mt-3 flex flex-col gap-2">
        <fieldset className="flex flex-col gap-1">
          <legend className="font-sans text-sm font-medium text-ink">Yakuniy xulosa</legend>
          {VERDICT_OPTIONS.map((opt) => (
            <div key={opt.value} className="rounded-md px-1 py-1 hover:bg-mint">
              <Radio
                name={`verdict-${item.assessment.id}`}
                checked={verdict === opt.value}
                onChange={() => setVerdict(opt.value)}
                label={
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${opt.dot}`} />
                    {opt.label}
                  </span>
                }
              />
            </div>
          ))}
        </fieldset>
        <label htmlFor={`feedback-${item.assessment.id}`} className="sr-only">
          Izoh
        </label>
        <textarea
          id={`feedback-${item.assessment.id}`}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={2}
          placeholder="Talabaga izoh yozing…"
          className="w-full rounded border border-line bg-paper px-3 py-2 font-sans text-sm text-ink placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        />
        {error && (
          <p role="alert" className="font-sans text-sm text-error">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy || !feedback.trim()} className="self-start">
          {busy ? 'Yuborilmoqda…' : 'Tasdiqlash'}
        </Button>
      </form>
    </li>
  );
}
