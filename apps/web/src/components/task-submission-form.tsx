'use client';

import { useState } from 'react';
import { Badge, Button } from '@imkon/ui';
import { AttachIcon, ClipboardIcon } from '@/components/shell-icons';
import type { TaskSubmissionOut } from '@/lib/types';

const STATUS_LABEL: Record<string, string> = {
  submitted: 'Yuborildi — javob kutilmoqda',
  reviewed: 'Baholandi',
};

export function TaskSubmissionForm({
  applicationId,
  taskTitle,
  taskDescription,
  initialSubmission,
}: {
  applicationId: number;
  taskTitle: string;
  taskDescription: string;
  initialSubmission: TaskSubmissionOut | null;
}) {
  const [submission, setSubmission] = useState(initialSubmission);
  const [text, setText] = useState(initialSubmission?.text ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set('text', text);
      if (file) form.set('file', file);
      const res = await fetch(`/api/applications/${applicationId}/task-submission`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? 'Topshirishda xatolik yuz berdi.');
        return;
      }
      setSubmission(data);
      setFile(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-line bg-paper p-4">
      <div className="flex items-center gap-2">
        <ClipboardIcon width={16} height={16} className="text-ink-soft" aria-hidden="true" />
        <p className="font-display text-base font-semibold text-ink">{taskTitle}</p>
      </div>
      {taskDescription && (
        <p className="mt-1 whitespace-pre-wrap font-sans text-sm text-ink-soft">
          {taskDescription}
        </p>
      )}

      {submission && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <Badge variant={submission.status === 'reviewed' ? 'success' : 'neutral'}>
            {STATUS_LABEL[submission.status] ?? submission.status}
          </Badge>
          {submission.file_url && (
            <a
              href={submission.file_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-sans text-xs text-primary underline-offset-4 hover:underline"
            >
              <AttachIcon width={14} height={14} aria-hidden="true" />
              Yuklangan fayl
            </a>
          )}
        </div>
      )}

      {submission?.feedback && (
        <p className="mt-3 rounded-lg bg-mint p-3 font-sans text-sm text-ink">
          <b className="font-semibold">Ish beruvchi izohi:</b> {submission.feedback}
        </p>
      )}

      <form onSubmit={submit} className="mt-3 flex flex-col gap-2">
        <label htmlFor={`task-response-${applicationId}`} className="sr-only">
          Javobingizni yozing
        </label>
        <textarea
          id={`task-response-${applicationId}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Javobingizni shu yerga yozing…"
          className="w-full rounded border border-line bg-paper px-3 py-2 font-sans text-sm text-ink placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        />
        <input
          type="file"
          aria-label="Fayl biriktirish (ixtiyoriy)"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="font-sans text-sm text-ink-soft"
        />
        {error && (
          <p role="alert" className="font-sans text-sm text-error">
            {error}
          </p>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={busy || !text.trim()}
          className="self-start"
        >
          {busy ? 'Yuborilmoqda…' : submission ? 'Yangilash' : 'Topshirish'}
        </Button>
      </form>
    </div>
  );
}
