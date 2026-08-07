'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, cn } from '@imkon/ui';
import {
  AlertIcon,
  CheckIcon,
  ClipboardIcon,
  RefreshIcon,
  SendIcon,
  StarIcon,
} from '@/components/shell-icons';
import type { CaseStorySessionDetail } from '@/lib/types';

const STAGES = [
  { key: 'vazifa', label: 'Vazifa', icon: ClipboardIcon },
  { key: 'jarayon', label: 'Jarayon', icon: RefreshIcon },
  { key: 'natija', label: 'Natija', icon: StarIcon },
] as const;

export function CaseStoryChat({ session }: { session: CaseStorySessionDetail }) {
  const router = useRouter();
  const [messages, setMessages] = useState(session.messages);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const isActive = session.status === 'active' && !justCompleted;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, sending]);

  // Bosqichlar backend'da alohida maydon sifatida saqlanmaydi — real suhbat holatidan
  // (javob berilganmi, yakunlanganmi) hisoblab olinadi, hech qanday son o'ylab topilmaydi.
  const stageIndex = useMemo(() => {
    if (session.status === 'completed') return 2;
    return messages.some((m) => m.role === 'user') ? 1 : 0;
  }, [messages, session.status]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai/case-story/${session.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? 'Xatolik yuz berdi.');
        return;
      }
      setMessages(data.messages);
      setBody('');
    } finally {
      setSending(false);
    }
  }

  async function complete() {
    setCompleting(true);
    try {
      const res = await fetch(`/api/ai/case-story/${session.id}/complete`, { method: 'POST' });
      if (res.ok) {
        // Darhol boshqa sahifaga o'tkazib yubormaymiz — foydalanuvchi avval shu
        // yerda "yakunlandi" tasdig'ini ko'rishi va o'zi portfolioga o'tishi kerak
        // (tahrirlashdan oldin ko'rib chiqish imkoniyati uchun).
        setJustCompleted(true);
        router.refresh();
      }
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-line bg-paper p-5 shadow-glass sm:p-6">
      <ol aria-label="Case-hikoya bosqichlari" className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
        {STAGES.map((stage, i) => {
          const state = i < stageIndex ? 'done' : i === stageIndex ? 'current' : 'upcoming';
          const Icon = stage.icon;
          return (
            <li key={stage.key} className="flex items-center gap-1.5">
              <span
                aria-current={state === 'current' ? 'step' : undefined}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-xs font-semibold transition-colors motion-reduce:transition-none',
                  state === 'done' && 'bg-primary text-primary-fg',
                  state === 'current' && 'bg-mint text-primary ring-2 ring-primary',
                  state === 'upcoming' && 'bg-mint text-ink-soft',
                )}
              >
                {state === 'done' ? <CheckIcon className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                {stage.label}
              </span>
              {i < STAGES.length - 1 && <span aria-hidden="true" className="h-px w-4 shrink-0 bg-line" />}
            </li>
          );
        })}
      </ol>

      <ul ref={listRef} className="flex max-h-[28rem] min-h-[16rem] flex-col gap-2 overflow-y-auto">
        {messages.map((m) => (
          <li
            key={m.id}
            className={
              m.role === 'user'
                ? 'ml-auto max-w-[85%] rounded-xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-primary-fg'
                : 'mr-auto max-w-[85%] rounded-xl rounded-tl-sm bg-mint px-3.5 py-2.5 text-ink'
            }
          >
            <p className="whitespace-pre-wrap font-sans text-base">{m.content}</p>
          </li>
        ))}
        {sending && (
          <li
            aria-hidden="true"
            className="mr-auto flex items-center gap-1.5 rounded-xl rounded-tl-sm bg-mint px-3.5 py-3"
          >
            <span className="imk-dot h-1.5 w-1.5 rounded-full bg-ink-soft" />
            <span className="imk-dot h-1.5 w-1.5 rounded-full bg-ink-soft [animation-delay:0.2s]" />
            <span className="imk-dot h-1.5 w-1.5 rounded-full bg-ink-soft [animation-delay:0.4s]" />
          </li>
        )}
      </ul>

      {error && (
        <div role="alert" className="imk-error !flex-row !items-center !p-3">
          <AlertIcon width={18} height={18} className="shrink-0 text-error" />
          <p className="font-sans text-sm text-error">{error}</p>
        </div>
      )}

      {isActive ? (
        <>
          <p className="flex items-center gap-1.5 font-sans text-xs text-ink-soft">
            <ClipboardIcon className="h-3.5 w-3.5 shrink-0" />
            Qoralama — suhbat yakunlanganda portfolioga yoziladi
          </p>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <label htmlFor="case-story-body" className="sr-only">
              Javobingizni yozing
            </label>
            <textarea
              id="case-story-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={2}
              placeholder="Javobingizni yozing…"
              className="min-h-touch w-full rounded-lg border border-line bg-paper px-3 py-2 font-sans text-base text-ink placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            />
            <Button type="submit" disabled={sending || !body.trim()}>
              <SendIcon className="h-4 w-4" />
              Yuborish
            </Button>
          </form>
          <Button variant="outline" disabled={completing} onClick={complete} className="self-start">
            {completing ? 'Yakunlanmoqda…' : "Hikoyani yakunlash va saqlash"}
          </Button>
        </>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-line bg-mint p-4">
          <p className="flex items-center gap-2 font-sans text-base font-semibold text-ink">
            <CheckIcon className="h-4 w-4 shrink-0 text-primary" />
            Bu suhbat yakunlangan
          </p>
          <p className="font-sans text-sm text-ink-soft">
            Vazifa, jarayon va natija Ziyo yordamida yozildi va portfolio elementiga saqlandi —
            albatta ko'rib chiqing, xato bo'lsa tahrirlang.
          </p>
          <Link
            href="/profil#yutuqlarim"
            className="rounded font-sans text-sm font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mint"
          >
            Portfolioda ko'rib chiqish va tahrirlash
          </Link>
        </div>
      )}
    </div>
  );
}
