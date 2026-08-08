'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@imkon/ui';
import { SimpleMarkdown } from '@/components/simple-markdown';
import { AlertIcon, MicIcon, SendIcon, SparkIcon } from '@/components/shell-icons';
import { useSpeechDictation } from '@/lib/use-speech-dictation';
import type { CareerCoachMessageOut } from '@/lib/types';

const SUGGESTED_PROMPTS = [
  'Portfolio yetarlimi?',
  "Maosh farqi qanday bo'ladi?",
  'Boshqa yo\'nalishlar bormi?',
];

export function CareerCoachChat({
  initialMessages,
}: {
  initialMessages: CareerCoachMessageOut[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedContent, setLastFailedContent] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const { supported: micSupported, listening, toggle: toggleMic } = useSpeechDictation(setBody);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, sending]);

  async function sendContent(content: string) {
    if (!content.trim() || sending) return;
    setSending(true);
    setError(null);
    setLastFailedContent(null);
    setBody('');
    setMessages((prev) => [
      ...prev,
      { id: -1, role: 'user', content, created_at: new Date().toISOString() },
    ]);
    try {
      const res = await fetch('/api/ai/career-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          res.status === 429
            ? "Kunlik so'rovlar limiti tugadi. Ertaga qayta urinib ko'ring."
            : (data.detail ?? 'Xatolik yuz berdi.'),
        );
        setLastFailedContent(res.status === 429 ? null : content);
        return;
      }
      setMessages((prev) => [...prev, data]);
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await sendContent(body);
  }

  async function handleNewChat() {
    setClearing(true);
    try {
      await fetch('/api/ai/career-coach', { method: 'DELETE' });
      setMessages([]);
      setError(null);
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-line bg-paper p-4">
      <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
        <p className="font-sans text-xs text-ink-soft">Suhbat tarixi saqlanadi · o'zbek tilida</p>
        {messages.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={clearing}
            onClick={handleNewChat}
          >
            {clearing ? 'Tozalanmoqda…' : 'Yangi suhbat'}
          </Button>
        )}
      </div>

      <ul ref={listRef} className="flex max-h-[28rem] min-h-[16rem] flex-col gap-3 overflow-y-auto">
        {messages.length === 0 && (
          <li className="imk-empty !items-center border-none !bg-transparent !py-8 text-center">
            <span className="imk-empty__icon">
              <SparkIcon width={22} height={22} aria-hidden="true" />
            </span>
            <span className="flex flex-col items-center gap-1">
              <span className="font-sans text-base font-semibold text-ink">Suhbatni boshlang</span>
              <span className="font-sans text-sm text-ink-soft">
                Karyera bo'yicha savolingizni yozing — masalan, "Menga qaysi kasb mos keladi?"
              </span>
            </span>
          </li>
        )}
        {messages.map((m) => (
          <li
            key={m.id}
            className={
              m.role === 'user'
                ? 'ml-auto max-w-[85%] rounded-card rounded-br-[6px] bg-deep px-4 py-3 text-deep-fg'
                : 'mr-auto max-w-[88%] rounded-card rounded-bl-[6px] border border-line bg-paper px-4 py-3 text-ink'
            }
          >
            {m.role === 'user' ? (
              <p className="whitespace-pre-wrap font-sans text-base">{m.content}</p>
            ) : (
              <SimpleMarkdown text={m.content} className="flex flex-col gap-2 font-sans text-base" />
            )}
          </li>
        ))}
        {sending && (
          <li
            aria-hidden="true"
            className="mr-auto flex items-center gap-1.5 rounded-card rounded-bl-[6px] border border-line bg-paper px-4 py-3.5"
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
          <p className="flex-1 font-sans text-sm text-error">{error}</p>
          {lastFailedContent && (
            <button
              type="button"
              onClick={() => sendContent(lastFailedContent)}
              className="min-h-touch shrink-0 rounded-full px-3 font-sans text-sm font-semibold text-primary hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Qayta urinish
            </button>
          )}
        </div>
      )}

      {messages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={sending}
              onClick={() => sendContent(prompt)}
              className="min-h-touch rounded-full border border-line px-3.5 font-sans text-sm font-semibold text-primary hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <label htmlFor="coach-body" className="sr-only">
          Xabar yozing
        </label>
        <textarea
          id="coach-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={1}
          placeholder="Savolingizni yozing…"
          className="min-h-touch w-full rounded-full border border-line bg-paper px-4 py-2.5 font-sans text-base text-ink placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        />
        {micSupported && (
          <button
            type="button"
            onClick={toggleMic}
            aria-pressed={listening}
            aria-label={listening ? 'Tinglanmoqda…' : 'Ovozli xabar yozish'}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
              listening ? 'bg-error text-error-fg' : 'bg-surface-2 text-ink-soft hover:text-ink'
            }`}
          >
            <MicIcon width={18} height={18} />
          </button>
        )}
        <Button
          type="submit"
          disabled={sending || !body.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full p-0"
          aria-label="Yuborish"
        >
          <SendIcon width={18} height={18} />
        </Button>
      </form>
    </div>
  );
}
