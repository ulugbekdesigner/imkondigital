'use client';

import { useState } from 'react';
import { Badge, Button, FileInput } from '@imkon/ui';
import type { SubmissionOut } from '@/lib/types';

const STATUS_LABEL: Record<string, string> = {
  submitted: 'Ko’rib chiqilmoqda',
  approved: 'Tasdiqlandi',
  rejected: 'Qayta ishlash kerak',
};

export function AssignmentSubmission({
  assignmentId,
  title,
  description,
  initialSubmission,
}: {
  assignmentId: number;
  title: string;
  description: string;
  initialSubmission: SubmissionOut | null;
}) {
  const [submission, setSubmission] = useState(initialSubmission);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set('assignment_id', String(assignmentId));
      form.set('text', text);
      if (file) form.set('file', file);
      const res = await fetch('/api/submissions', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? 'Topshirishda xatolik yuz berdi.');
        return;
      }
      setSubmission(data);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-line bg-paper p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-base font-semibold text-ink">{title}</p>
        {submission && (
          <Badge variant={submission.status === 'approved' ? 'success' : 'neutral'}>
            {STATUS_LABEL[submission.status] ?? submission.status}
          </Badge>
        )}
      </div>
      {description && <p className="mt-1 font-sans text-sm text-ink-soft">{description}</p>}

      {submission ? (
        <div className="mt-3">
          <p className="whitespace-pre-wrap font-sans text-sm text-ink">{submission.text}</p>
          {submission.file_url && (
            <a
              href={submission.file_url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block font-sans text-sm text-primary underline-offset-4 hover:underline"
            >
              Yuklangan fayl
            </a>
          )}
          {submission.feedback && (
            <p className="mt-2 rounded bg-mint p-2 font-sans text-sm text-ink">
              Ustoz izohi: {submission.feedback}
            </p>
          )}
          {submission.status === 'rejected' && (
            <p className="mt-2 font-sans text-sm text-ink-soft">
              Izohni hisobga olib qayta topshirishingiz mumkin.
            </p>
          )}
        </div>
      ) : null}

      {(!submission || submission.status === 'rejected') && (
        <form onSubmit={submit} className="mt-3 flex flex-col gap-2">
          <label htmlFor={`assignment-${assignmentId}`} className="sr-only">
            Topshiriq matni
          </label>
          <textarea
            id={`assignment-${assignmentId}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Ishingiz haqida yozing…"
            className="w-full rounded border border-line bg-paper px-3 py-2 font-sans text-sm text-ink placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          />
          <FileInput
            aria-label="Fayl biriktirish (ixtiyoriy)"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {error && (
            <p role="alert" className="font-sans text-sm text-error">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy || !text.trim()} className="self-start">
            {busy ? 'Topshirilmoqda…' : 'Topshirish'}
          </Button>
        </form>
      )}
    </div>
  );
}
