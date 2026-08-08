'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MicIcon, SendIcon, CheckIcon } from '@/components/shell-icons';
import { useSpeechDictation } from '@/lib/use-speech-dictation';
import { SimpleMarkdown } from '@/components/simple-markdown';
import type { PlacementTestSessionDetail } from '@/lib/types';

const LANGUAGE_LABEL: Record<string, string> = { en: 'Ingliz tili', ru: 'Rus tili' };
const MIN_QUESTIONS_BEFORE_COMPLETE = 4;

export function PlacementTestChat({ session }: { session: PlacementTestSessionDetail }) {
  const router = useRouter();
  const [messages, setMessages] = useState(session.messages);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const isActive = session.status === 'active';
  const questionCount = messages.filter((m) => m.role === 'assistant').length;
  const { supported: micSupported, listening, toggle: toggleMic } = useSpeechDictation(setBody);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai/placement-test/${session.id}/messages`, {
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
      await fetch(`/api/ai/placement-test/${session.id}/complete`, { method: 'POST' });
      router.refresh();
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="relative flex flex-col overflow-hidden rounded-[20px] bg-deep shadow-glass">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-teal/50 blur-[45px]"
      />

      <div className="relative flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <span className="font-display text-lg font-bold text-deep-fg">
          {LANGUAGE_LABEL[session.language] ?? 'Til testi'} — daraja aniqlash
        </span>
        <div className="flex items-center gap-2">
          {questionCount > 0 && isActive && (
            <span className="rounded-full bg-teal px-3 py-1.5 font-sans text-xs font-semibold text-deep">
              {questionCount}-savol
            </span>
          )}
          <span className="rounded-full bg-white/10 px-3 py-1.5 font-sans text-xs font-semibold text-mist">
            {isActive ? 'Faol' : 'Yakunlangan'}
          </span>
        </div>
      </div>

      <ul
        ref={listRef}
        className="relative flex max-h-[28rem] min-h-[16rem] flex-col gap-3 overflow-y-auto px-5 py-5"
      >
        {messages.map((m) => (
          <li
            key={m.id}
            className={
              m.role === 'user'
                ? 'ml-auto max-w-[85%] rounded-card rounded-br-[6px] bg-bright px-4 py-3 text-white'
                : 'mr-auto max-w-[88%] rounded-card rounded-bl-[6px] border border-white/15 bg-white/8 px-4 py-3 text-deep-fg'
            }
          >
            {m.role === 'user' ? (
              <p className="whitespace-pre-wrap font-sans text-base leading-relaxed">{m.content}</p>
            ) : (
              <SimpleMarkdown
                text={m.content}
                className="flex flex-col gap-2 font-sans text-base leading-relaxed"
              />
            )}
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="relative px-5 font-sans text-sm text-error">
          {error}
        </p>
      )}

      <div className="relative px-5 pb-5">
        {isActive ? (
          <div className="flex flex-col gap-3">
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <label htmlFor="placement-test-body" className="sr-only">
                Javobingizni yozing
              </label>
              <textarea
                id="placement-test-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={2}
                placeholder="Javobingizni yozing yoki mikrofondan ayting…"
                className="min-h-touch w-full rounded-card border border-white/20 bg-white/5 px-4 py-3 font-sans text-base text-deep-fg placeholder:text-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-deep"
              />
              {micSupported && (
                <button
                  type="button"
                  onClick={toggleMic}
                  aria-pressed={listening}
                  aria-label={listening ? 'Tinglanmoqda…' : 'Ovozli javob yozish'}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                    listening ? 'bg-error text-error-fg' : 'bg-white/10 text-mist hover:text-white'
                  }`}
                >
                  <MicIcon width={18} height={18} />
                </button>
              )}
              <button
                type="submit"
                disabled={sending || !body.trim()}
                aria-label="Yuborish"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-deep disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                <SendIcon width={18} height={18} />
              </button>
            </form>
            <button
              type="button"
              disabled={completing || questionCount < MIN_QUESTIONS_BEFORE_COMPLETE}
              onClick={complete}
              title={
                questionCount < MIN_QUESTIONS_BEFORE_COMPLETE
                  ? `Yakunlashdan oldin kamida ${MIN_QUESTIONS_BEFORE_COMPLETE} ta savolga javob bering`
                  : undefined
              }
              className="self-start rounded-full border border-white/25 px-4 py-2 font-sans text-sm font-semibold text-mist hover:text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              {completing ? 'Baholanmoqda…' : 'Testni yakunlash va natijani ko\'rish'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 rounded-card border border-teal/40 bg-teal/10 p-4">
            <p className="flex items-center gap-1.5 font-display text-lg font-bold text-deep-fg">
              <CheckIcon width={18} height={18} className="shrink-0 text-teal" />
              Sizning darajangiz: {session.cefr_level ?? '—'}
            </p>
            {session.level_feedback && (
              <p className="font-sans text-base leading-relaxed text-mist">
                {session.level_feedback}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
