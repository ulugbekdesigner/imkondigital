'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, ConfirmDialog, Input } from '@imkon/ui';
import { VideoIcon } from '@/components/shell-icons';
import { formatDateTime } from '@/lib/format';
import type { CourseCard, LiveLessonOut } from '@/lib/types';

function ScheduleForm({ courses }: { courses: CourseCard[] }) {
  const router = useRouter();
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId || !scheduledAt) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/live-lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          scheduled_at: new Date(scheduledAt).toISOString(),
          meeting_url: meetingUrl,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(typeof data.detail === 'string' ? data.detail : 'Rejalashtirishda xatolik.');
        return;
      }
      setTitle('');
      setDescription('');
      setScheduledAt('');
      setMeetingUrl('');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (courses.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-surface-2 p-4 font-sans text-sm text-ink-soft">
        Jonli dars rejalashtirish uchun avval kamida bitta kurs nashr qiling.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="font-sans text-sm font-medium text-ink">Kurs</span>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            required
            className="min-h-touch rounded-xl border border-line bg-paper px-3 font-sans text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-sans text-sm font-medium text-ink">Sana va vaqt</span>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            required
            className="min-h-touch rounded-xl border border-line bg-paper px-3 font-sans text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          />
        </label>
      </div>
      <Input
        label="Sarlavha"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        placeholder="Masalan: Savol-javob sessiyasi"
      />
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-sm font-medium text-ink">Tavsif (ixtiyoriy)</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="rounded-xl border border-line bg-paper px-3 py-2 font-sans text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        />
      </label>
      <Input
        label="Uchrashuv havolasi (Zoom, Google Meet va h.k.)"
        type="url"
        value={meetingUrl}
        onChange={(e) => setMeetingUrl(e.target.value)}
        required
        placeholder="https://meet.google.com/..."
      />
      {error && (
        <p role="alert" className="font-sans text-sm text-error">
          {error}
        </p>
      )}
      <Button type="submit" isLoading={loading} className="self-start">
        Jonli darsni rejalashtirish
      </Button>
    </form>
  );
}

function DeleteButton({ lessonId }: { lessonId: number }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function remove() {
    setLoading(true);
    try {
      const res = await fetch(`/api/live-lessons/${lessonId}`, { method: 'DELETE' });
      if (res.ok) {
        setConfirmOpen(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="ghost" className="text-error hover:bg-error/10" onClick={() => setConfirmOpen(true)}>
        Bekor qilish
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={remove}
        title="Jonli darsni bekor qilasizmi?"
        description="O'quvchilar bu darsni endi ko'rmaydi."
        confirmLabel="Bekor qilish"
        confirmLoading={loading}
        destructive
      />
    </>
  );
}

export function LiveLessonManager({
  courses,
  lessons,
}: {
  courses: CourseCard[];
  lessons: LiveLessonOut[];
}) {
  const upcoming = lessons.filter((l) => !l.is_past);
  const past = lessons.filter((l) => l.is_past);

  return (
    <div className="flex flex-col gap-6">
      <ScheduleForm courses={courses} />

      {upcoming.length > 0 ? (
        <ul className="flex flex-col gap-2.5">
          {upcoming.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-paper p-4">
              <div>
                <p className="font-sans text-sm font-semibold text-ink">{l.title}</p>
                <p className="font-sans text-xs text-ink-soft">
                  {l.course_title} · {formatDateTime(l.scheduled_at)}
                </p>
                {l.description && (
                  <p className="mt-1 font-sans text-sm text-ink-soft">{l.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={l.meeting_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center rounded-full bg-primary px-4 font-sans text-xs font-semibold text-primary-fg hover:brightness-110"
                >
                  Havola
                </a>
                <DeleteButton lessonId={l.id} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="imk-empty">
          <span className="imk-empty__icon" aria-hidden="true">
            <VideoIcon width={22} height={22} />
          </span>
          <p className="font-sans text-base font-medium text-ink">Rejalashtirilgan jonli dars yo'q</p>
          <p className="max-w-sm font-sans text-sm text-ink-soft">
            Yuqoridagi formadan o'quvchilaringiz uchun jonli sessiya rejalashtiring.
          </p>
        </div>
      )}

      {past.length > 0 && (
        <details className="rounded-xl border border-line bg-surface-2 p-4">
          <summary className="cursor-pointer font-sans text-sm font-medium text-ink">
            O'tgan jonli darslar ({past.length})
          </summary>
          <ul className="mt-3 flex flex-col gap-2">
            {past.map((l) => (
              <li key={l.id} className="font-sans text-sm text-ink-soft">
                {l.title} — {l.course_title} · {formatDateTime(l.scheduled_at)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
