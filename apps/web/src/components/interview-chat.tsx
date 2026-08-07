'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MicIcon, SendIcon, CheckIcon, AlertIcon } from '@/components/shell-icons';
import { useSpeechDictation } from '@/lib/use-speech-dictation';
import { SimpleMarkdown } from '@/components/simple-markdown';
import type { InterviewSessionDetail } from '@/lib/types';

export function InterviewChat({ session }: { session: InterviewSessionDetail }) {
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
  }, [messages, sending]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai/interview/${session.id}/messages`, {
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
      await fetch(`/api/ai/interview/${session.id}/complete`, { method: 'POST' });
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
          {session.vacancy_title ?? 'Umumiy mashq'}
        </span>
        <div className="flex items-center gap-2">
          {questionCount > 0 && (
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
                ? 'ml-auto max-w-[85%] rounded-[18px] rounded-br-[6px] bg-bright px-4 py-3 text-white'
                : 'mr-auto max-w-[88%] rounded-[18px] rounded-bl-[6px] border border-white/15 bg-white/8 px-4 py-3 text-deep-fg'
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
        {sending && (
          <li
            aria-hidden="true"
            className="mr-auto flex items-center gap-1.5 rounded-[18px] rounded-bl-[6px] border border-white/15 bg-white/8 px-4 py-3.5"
          >
            <span className="imk-dot h-1.5 w-1.5 rounded-full bg-mist" />
            <span className="imk-dot h-1.5 w-1.5 rounded-full bg-mist [animation-delay:0.2s]" />
            <span className="imk-dot h-1.5 w-1.5 rounded-full bg-mist [animation-delay:0.4s]" />
          </li>
        )}
      </ul>

      {error && (
        <div
          role="alert"
          className="relative mx-5 mb-1 flex items-center gap-2 rounded-[14px] border border-error/40 bg-error/15 px-3.5 py-2.5"
        >
          <AlertIcon width={16} height={16} className="shrink-0 text-error" />
          <p className="font-sans text-sm text-deep-fg">{error}</p>
        </div>
      )}

      <div className="relative px-5 pb-5">
        {isActive ? (
          <div className="flex flex-col gap-3">
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <label htmlFor="interview-body" className="sr-only">
                Javobingizni yozing
              </label>
              <textarea
                id="interview-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={2}
                placeholder="Javobingizni yozing yoki mikrofondan ayting…"
                className="min-h-touch w-full rounded-[18px] border border-white/20 bg-white/5 px-4 py-3 font-sans text-base text-deep-fg placeholder:text-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-deep"
              />
              {micSupported && (
                <button
                  type="button"
                  onClick={toggleMic}
                  aria-pressed={listening}
                  aria-label={listening ? 'Tinglanmoqda…' : 'Ovozli javob yozish'}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                    listening ? 'bg-error text-white' : 'bg-white/10 text-mist hover:text-white'
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
              disabled={completing}
              onClick={complete}
              className="self-start rounded-full border border-white/25 px-4 py-2 font-sans text-sm font-semibold text-mist hover:text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              {completing ? 'Yakunlanmoqda…' : 'Sessiyani yakunlash'}
            </button>
          </div>
        ) : (
          <p className="flex items-center gap-1.5 rounded-[18px] border border-white/15 bg-white/8 p-3 font-sans text-base text-deep-fg">
            <CheckIcon width={16} height={16} className="shrink-0 text-teal" />
            Bu mashq yakunlangan
          </p>
        )}
      </div>
    </div>
  );
}
