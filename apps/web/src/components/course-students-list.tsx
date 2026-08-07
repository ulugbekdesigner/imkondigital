'use client';

import { useState } from 'react';
import { Badge, Button } from '@imkon/ui';
import { CheckIcon, UsersIcon } from '@/components/shell-icons';
import type { StudentProgressItem } from '@/lib/types';
import { formatDate } from '@/lib/format';

const STATUS_LABEL: Record<string, string> = {
  active: 'Faol',
  completed: 'Tugatgan',
};

function MessageForm({
  courseId,
  studentId,
  onSent,
}: {
  courseId: number;
  studentId: number;
  onSent: () => void;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/students/${studentId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      });
      if (res.ok || res.status === 204) onSent();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={send} className="mt-2 flex flex-col gap-2">
      <input
        aria-label="Xabar sarlavhasi"
        placeholder="Sarlavha…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="min-h-touch rounded border border-line bg-paper px-3 py-1 font-sans text-sm text-ink"
      />
      <textarea
        aria-label="Xabar matni"
        placeholder="Xabar matni…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        className="rounded border border-line bg-paper px-3 py-1 font-sans text-sm text-ink"
      />
      <Button type="submit" size="sm" variant="outline" disabled={busy || !title.trim()}>
        Yuborish
      </Button>
    </form>
  );
}

export function CourseStudentsList({
  courseId,
  students,
}: {
  courseId: number;
  students: StudentProgressItem[];
}) {
  const [openMessageFor, setOpenMessageFor] = useState<number | null>(null);
  const [sentTo, setSentTo] = useState<Set<number>>(new Set());

  if (students.length === 0) {
    return (
      <div className="imk-empty">
        <span className="imk-empty__icon" aria-hidden="true">
          <UsersIcon width={22} height={22} />
        </span>
        <p className="font-sans text-base font-medium text-ink">Hali o'quvchi yo'q</p>
        <p className="max-w-sm font-sans text-sm text-ink-soft">
          Kursingizga birinchi o'quvchi yozilganda shu yerda ko'rinadi.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {students.map((s) => (
        <li key={s.user_id} className="rounded border border-line p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-sans text-base text-ink">{s.full_name}</span>
            <div className="flex items-center gap-2">
              {s.is_stuck && <Badge variant="warn">Qotib qolgan</Badge>}
              <Badge variant={s.status === 'completed' ? 'success' : 'neutral'}>
                {STATUS_LABEL[s.status] ?? s.status} — {s.progress_pct}%
              </Badge>
            </div>
          </div>
          <p className="mt-1 font-mono text-xs text-ink-soft">
            So'nggi faollik: {formatDate(s.last_activity_at)}
          </p>
          {sentTo.has(s.user_id) ? (
            <p className="mt-2 inline-flex items-center gap-1 font-sans text-xs text-primary">
              <CheckIcon width={14} height={14} aria-hidden="true" />
              Xabar yuborildi
            </p>
          ) : openMessageFor === s.user_id ? (
            <MessageForm
              courseId={courseId}
              studentId={s.user_id}
              onSent={() => {
                setSentTo((prev) => new Set(prev).add(s.user_id));
                setOpenMessageFor(null);
              }}
            />
          ) : (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="mt-2"
              onClick={() => setOpenMessageFor(s.user_id)}
            >
              Xabar yuborish
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
