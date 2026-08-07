'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@imkon/ui';
import type { StudyBuddyMessageOut } from '@/lib/types';

const QUICK_ACTIONS = [
  { label: 'Tushunmadim', content: "Tushunmadim, soddaroq tushuntiring." },
  { label: 'Misol keltir', content: "Shu mavzu bo'yicha real hayotiy misol keltiring." },
  { label: 'Meni tekshir', content: "Shu mavzu bo'yicha bitta savol bering, meni tekshiring." },
];

export function StudyBuddyPanel({
  lessonId,
  initialMessages,
}: {
  lessonId: number;
  initialMessages: StudyBuddyMessageOut[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [lessonId, initialMessages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function send(content: string) {
    if (!content.trim() || sending) return;
    setSending(true);
    setError(null);
    setBody('');
    setMessages((prev) => [
      ...prev,
      { id: -1, role: 'user' as const, content, created_at: new Date().toISOString() },
    ]);
    try {
      const res = await fetch(`/api/ai/study-buddy/${lessonId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          res.status === 429
            ? "Kunlik AI so'rovlar limiti tugadi. Ertaga qayta urinib ko'ring."
            : (data.detail ?? 'Xatolik yuz berdi.'),
        );
        return;
      }
      setMessages((prev) => [...prev, data]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-paper p-4">
      <h3 className="flex items-center gap-1.5 font-display text-base font-semibold text-ink">
        <img src="/brand/ziyo-mark-color.svg" alt="" aria-hidden="true" width={20} height={20} className="h-5 w-5 shrink-0" />
        Ziyo
      </h3>
      <ul ref={listRef} className="flex max-h-80 min-h-[10rem] flex-col gap-2 overflow-y-auto">
        {messages.length === 0 && (
          <li className="font-sans text-sm text-ink-soft">
            Dars bo'yicha savolingiz bo'lsa, shu yerga yozing yoki quyidagi tugmalardan birini
            tanlang.
          </li>
        )}
        {messages.map((m) => (
          <li
            key={m.id}
            className={
              m.role === 'user'
                ? 'ml-auto max-w-[85%] rounded-lg bg-primary px-3 py-2 text-primary-fg'
                : 'mr-auto max-w-[85%] rounded-lg bg-mint px-3 py-2 text-ink'
            }
          >
            <p className="whitespace-pre-wrap font-sans text-sm">{m.content}</p>
          </li>
        ))}
        {sending && (
          <li
            aria-live="polite"
            className="mr-auto flex items-center gap-1 rounded-lg bg-mint px-3 py-2.5 text-ink"
          >
            <span className="sr-only">Ziyo yozmoqda…</span>
            <span aria-hidden="true" className="imk-dot h-1.5 w-1.5 rounded-full bg-current" />
            <span
              aria-hidden="true"
              className="imk-dot h-1.5 w-1.5 rounded-full bg-current"
              style={{ animationDelay: '0.2s' }}
            />
            <span
              aria-hidden="true"
              className="imk-dot h-1.5 w-1.5 rounded-full bg-current"
              style={{ animationDelay: '0.4s' }}
            />
          </li>
        )}
      </ul>
      {error && (
        <p role="alert" className="font-sans text-sm text-error">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((a) => (
          <Button
            key={a.label}
            type="button"
            variant="outline"
            disabled={sending}
            onClick={() => send(a.content)}
            className="text-xs"
          >
            {a.label}
          </Button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(body);
        }}
        className="flex gap-2"
      >
        <label htmlFor={`study-buddy-${lessonId}`} className="sr-only">
          Savolingizni yozing
        </label>
        <textarea
          id={`study-buddy-${lessonId}`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={1}
          placeholder="Savolingizni yozing…"
          className="min-h-touch w-full rounded border border-line bg-paper px-3 py-2 font-sans text-sm text-ink placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        />
        <Button type="submit" disabled={sending || !body.trim()}>
          Yuborish
        </Button>
      </form>
      <p className="font-sans text-xs text-ink-soft">
        Bu suhbat dars bilan birga saqlanadi — keyin qaytib o'qishingiz mumkin.
      </p>
    </div>
  );
}
