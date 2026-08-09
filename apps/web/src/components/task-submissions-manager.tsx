'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button } from '@imkon/ui';
import { AttachIcon, EyeIcon, UsersIcon } from '@/components/shell-icons';
import type { BlindTaskSubmissionOut } from '@/lib/types';

const STATUS_LABEL: Record<string, string> = {
  submitted: 'Baholanmagan',
  reviewed: 'Baholangan',
};

export function TaskSubmissionsManager({
  initialSubmissions,
}: {
  initialSubmissions: BlindTaskSubmissionOut[];
}) {
  const router = useRouter();
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [feedbackDraft, setFeedbackDraft] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  async function sendFeedback(submissionId: number) {
    const feedback = (feedbackDraft[submissionId] ?? '').trim();
    if (!feedback) return;
    setBusyId(submissionId);
    try {
      const res = await fetch(`/api/task-submissions/${submissionId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });
      if (res.ok) {
        const updated: BlindTaskSubmissionOut = await res.json();
        setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? updated : s)));
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function reveal(submissionId: number) {
    setBusyId(submissionId);
    try {
      const res = await fetch(`/api/task-submissions/${submissionId}/reveal`, { method: 'POST' });
      if (res.ok) {
        const updated: BlindTaskSubmissionOut = await res.json();
        setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? updated : s)));
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  if (submissions.length === 0) {
    return (
      <div className="imk-empty">
        <span className="imk-empty__icon" aria-hidden="true">
          <UsersIcon width={26} height={26} />
        </span>
        <p className="font-sans text-base font-medium text-ink">Hali topshiriq javobi yo'q</p>
        <p className="max-w-sm font-sans text-sm text-ink-soft">
          Nomzod ariza topshirib, sinov topshirig'ini bajarganda shu yerda ism/rasmsiz ko'rinadi.
        </p>
      </div>
    );
  }

  return (
    <ul className="overflow-hidden rounded-card border border-line bg-paper">
      {submissions.map((s) => (
        <li key={s.id} className="border-t border-line p-4 first:border-t-0 sm:p-[18px]">
          <div className="flex flex-wrap items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 font-sans text-sm font-bold text-ink"
            >
              #{s.blind_index}
            </span>
            <div className="min-w-[10rem] flex-1">
              <p className="font-sans text-[15px] font-bold text-ink">
                {s.revealed && s.full_name ? s.full_name : `Nomzod #${s.blind_index}`}
              </p>
              {s.revealed && s.username && (
                <p className="font-mono text-xs text-ink-soft">@{s.username}</p>
              )}
            </div>
            <Badge variant={s.status === 'reviewed' ? 'success' : 'neutral'}>
              {STATUS_LABEL[s.status] ?? s.status}
            </Badge>
          </div>

          <p className="mt-3 whitespace-pre-wrap rounded-xl bg-surface-2 p-3 font-sans text-sm text-ink">
            {s.text || 'Matn kiritilmagan.'}
          </p>
          {s.file_url && (
            <a
              href={s.file_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 font-sans text-sm text-primary underline-offset-4 hover:underline"
            >
              <AttachIcon width={16} height={16} aria-hidden="true" />
              Biriktirilgan faylni ochish
            </a>
          )}

          {s.feedback && (
            <p className="mt-3 rounded-xl bg-mint p-3 font-sans text-sm text-ink">
              <b className="font-semibold">Sizning izohingiz:</b> {s.feedback}
            </p>
          )}

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
            <label htmlFor={`feedback-${s.id}`} className="sr-only">
              Izoh yozing
            </label>
            <textarea
              id={`feedback-${s.id}`}
              value={feedbackDraft[s.id] ?? ''}
              onChange={(e) => setFeedbackDraft((prev) => ({ ...prev, [s.id]: e.target.value }))}
              rows={2}
              placeholder="Izoh yozing…"
              className="min-h-touch w-full flex-1 rounded border border-line bg-paper px-3 py-2 font-sans text-sm text-ink placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            />
            <Button
              type="button"
              size="sm"
              disabled={busyId === s.id || !(feedbackDraft[s.id] ?? '').trim()}
              onClick={() => sendFeedback(s.id)}
            >
              Baholash
            </Button>
          </div>

          {!s.revealed && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 gap-1.5"
              disabled={busyId === s.id}
              onClick={() => reveal(s.id)}
            >
              <EyeIcon width={16} height={16} aria-hidden="true" />
              Ismini ko'rsatish
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
