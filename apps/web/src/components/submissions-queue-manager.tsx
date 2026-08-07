'use client';
/* ============================================================
   IMKON DIGITAL — Topshiriqlar navbati: JADVAL + O'NG DRAWER
   (docs/design/README.md 2-bo'lim: "Topshiriqlar navbati (jadval) + o'ng
   drawer (baholash)"). Qatorni bosish o'ng tomondan sirg'aluvchi
   panelni ochadi — baholash shu yerda amalga oshiriladi, jadval esa
   holatni darhol yangilaydi.
   ============================================================ */
import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { Badge, Button, cn } from '@imkon/ui';
import { AttachIcon, CloseIcon } from '@/components/shell-icons';
import { useToast } from '@/components/toast';
import { initialsOf } from '@/lib/avatar';
import type { InstructorSubmissionItem } from '@/lib/types';

function draftKey(submissionId: number): string {
  return `imkon-submission-draft-${submissionId}`;
}

const STATUS_LABEL: Record<string, string> = {
  submitted: 'Kutilmoqda',
  approved: 'Tasdiqlangan',
  rejected: 'Rad etilgan',
};

export type SubmissionQueueItem = InstructorSubmissionItem & {
  submittedLabel: string;
  overdue: boolean;
};

function SubmissionDrawer({
  item,
  closeButtonRef,
  onClose,
  onUpdate,
}: {
  item: SubmissionQueueItem;
  closeButtonRef: RefObject<HTMLButtonElement>;
  onClose: () => void;
  onUpdate: (patch: Partial<InstructorSubmissionItem>) => void;
}) {
  const showToast = useToast();
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    if (item.status !== 'submitted') {
      setFeedback('');
      return;
    }
    setFeedback(window.localStorage.getItem(draftKey(item.id)) ?? '');
  }, [item.id, item.status]);

  function saveDraft() {
    window.localStorage.setItem(draftKey(item.id), feedback);
    showToast({ variant: 'system', title: 'Qoralama saqlandi' });
  }

  async function review(approve: boolean) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/submissions/${item.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve, feedback }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? 'Xatolik yuz berdi.');
        return;
      }
      onUpdate({ status: approve ? 'approved' : 'rejected', feedback });
      window.localStorage.removeItem(draftKey(item.id));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`submission-drawer-title-${item.id}`}
      className="fixed inset-0 z-[150] flex justify-end"
    >
      <div aria-hidden="true" className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="imk-reveal relative flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto bg-paper p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-sans text-xs font-bold text-white"
              style={{ background: 'linear-gradient(140deg, rgb(var(--imkon-teal)), rgb(var(--imkon-bright)))' }}
            >
              {initialsOf(item.student_name)}
            </span>
            <div>
              <p id={`submission-drawer-title-${item.id}`} className="font-display text-lg font-bold text-ink">
                {item.student_name}
              </p>
              <p className="font-sans text-sm text-ink-soft">
                {item.assignment_title} · {item.course_title}
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Baholash panelini yopish"
            className="flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <CloseIcon width={18} height={18} />
          </button>
        </div>

        {item.text && (
          <p className="whitespace-pre-wrap rounded-xl bg-surface-2 p-3 font-sans text-sm text-ink">{item.text}</p>
        )}
        {item.file_url && (
          <a
            href={item.file_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit min-h-touch items-center gap-1.5 font-sans text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            <AttachIcon width={16} height={16} aria-hidden="true" />
            Faylni ochish
          </a>
        )}

        {item.status === 'submitted' ? (
          <div className="mt-auto flex flex-col gap-2 border-t border-line pt-4">
            <label htmlFor={`submission-drawer-feedback-${item.id}`} className="font-sans text-sm font-medium text-ink">
              Izoh (ixtiyoriy)
            </label>
            <textarea
              id={`submission-drawer-feedback-${item.id}`}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              placeholder="O'quvchiga izoh yozing…"
              className="w-full rounded-2xl border border-line bg-paper px-3.5 py-2.5 font-sans text-sm text-ink placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
            {error && (
              <p role="alert" className="font-sans text-sm text-error">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" isLoading={busy} onClick={() => review(true)}>
                Qabul
              </Button>
              <Button type="button" variant="outline" disabled={busy} onClick={() => review(false)}>
                Qayta ishlash
              </Button>
              <Button type="button" variant="ghost" disabled={busy} onClick={saveDraft}>
                Qoralama saqlash
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-auto flex flex-col gap-3 border-t border-line pt-4">
            <Badge variant={item.status === 'approved' ? 'success' : 'error'}>
              {STATUS_LABEL[item.status]}
            </Badge>
            {item.feedback && (
              <p className={cn('rounded-xl bg-surface-2 p-2.5 font-sans text-sm text-ink')}>
                Sizning izohingiz: {item.feedback}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function SubmissionsQueueManager({ items: initialItems }: { items: SubmissionQueueItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [openId, setOpenId] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const active = items.find((i) => i.id === openId) ?? null;

  useEffect(() => {
    if (!active) return;
    closeButtonRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [active?.id]);

  function close() {
    const id = openId;
    setOpenId(null);
    if (id != null) triggerRefs.current.get(id)?.focus();
  }

  function updateItem(id: number, patch: Partial<InstructorSubmissionItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  return (
    <>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <caption className="sr-only">Topshiriqlar navbati — o'quvchi, topshiriq, holat va baholash amali</caption>
          <thead>
            <tr className="border-b border-line bg-surface-2">
              <th scope="col" className="px-4 py-3 font-sans text-xs font-semibold uppercase tracking-wide text-ink-soft">
                O'quvchi
              </th>
              <th scope="col" className="px-4 py-3 font-sans text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Topshiriq
              </th>
              <th scope="col" className="px-4 py-3 font-sans text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Yuborilgan
              </th>
              <th scope="col" className="px-4 py-3 font-sans text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Holat
              </th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Amal</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const badgeVariant =
                item.status === 'approved'
                  ? 'success'
                  : item.status === 'rejected'
                    ? 'error'
                    : item.overdue
                      ? 'error'
                      : 'warn';
              const badgeLabel = item.status === 'submitted' && item.overdue ? 'Kechikkan' : STATUS_LABEL[item.status];
              return (
                <tr key={item.id} className="border-b border-line last:border-b-0 hover:bg-mint/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-sans text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(140deg, rgb(var(--imkon-teal)), rgb(var(--imkon-bright)))' }}
                      >
                        {initialsOf(item.student_name)}
                      </span>
                      <span className="font-sans text-sm font-semibold text-ink">{item.student_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-sans text-sm text-ink">{item.assignment_title}</p>
                    <p className="font-sans text-xs text-ink-soft">{item.course_title}</p>
                  </td>
                  <td className="px-4 py-3 font-sans text-sm text-ink-soft">{item.submittedLabel}</td>
                  <td className="px-4 py-3">
                    <Badge variant={badgeVariant}>{badgeLabel}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      ref={(el) => {
                        if (el) triggerRefs.current.set(item.id, el);
                        else triggerRefs.current.delete(item.id);
                      }}
                      onClick={() => setOpenId(item.id)}
                      className="border border-line text-ink"
                    >
                      {item.status === 'submitted' ? 'Baholash' : "Ko'rish"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {active && (
        <SubmissionDrawer
          item={active}
          closeButtonRef={closeButtonRef}
          onClose={close}
          onUpdate={(patch) => updateItem(active.id, patch)}
        />
      )}
    </>
  );
}
