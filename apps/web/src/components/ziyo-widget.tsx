'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button, cn } from '@imkon/ui';
import { ZiyoMascot } from '@/components/landing/ziyo-mascot';
import { AlertIcon, ChevronRightIcon, CloseIcon, MicIcon } from '@/components/shell-icons';

type Role = 'user' | 'assistant';
interface ChatMsg {
  role: Role;
  content: string;
  navigate?: { path: string; label: string } | null;
  isError?: boolean;
  /** Gemini o'zi band (429) — qayta urinish darhol yordam bermaydi, tugma yashiriladi. */
  isQuotaError?: boolean;
}

interface SpeechRecognitionResultLike {
  transcript: string;
}
interface SpeechRecognitionEventLike extends Event {
  results: { [index: number]: { [index: number]: SpeechRecognitionResultLike } };
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  start: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const GREETING_BY_PREFIX: [string, string][] = [
  ['/kurslar', "Salom! Men Ziyo. Kurs tanlashda yordam beraymi?"],
  ['/vakansiyalar', 'Salom! Men Ziyo. Sizga mos ishlarni ko‘rsataymi?'],
  ['/mening-yolim', 'Salom! Bugungi vazifangiz yoki keyingi qadam haqida so‘rang.'],
  ['/gigs', 'Salom! Freelance xizmatlar bo‘yicha savolingiz bormi?'],
  ['/xayriya', 'Salom! Xayriya loyihalari haqida savol bering.'],
];
const DEFAULT_GREETING = 'Salom! Men Ziyo — sizga yo‘l ko‘rsataymi?';

function greetingFor(pathname: string): string {
  const hit = GREETING_BY_PREFIX.find(([prefix]) => pathname.startsWith(prefix));
  return hit ? hit[1] : DEFAULT_GREETING;
}

type ChatMode = 'default' | 'practice';
type PracticeLanguage = 'en' | 'ru';
const PRACTICE_LANGUAGES: { key: PracticeLanguage; label: string; speechLang: string }[] = [
  { key: 'en', label: 'EN', speechLang: 'en-US' },
  { key: 'ru', label: 'RU', speechLang: 'ru-RU' },
];
const PRACTICE_GREETING: Record<PracticeLanguage, string> = {
  en: "Hi! I'm Ziyo. Let's practice your work English — I'll pick a scenario, or you can suggest one.",
  ru: 'Привет! Я Зиё. Давайте потренируем деловой русский — я выберу ситуацию, или предложите свою.',
};

/** `NAVIGATE: /path | Tugma matni` qatorini matndan ajratib oladi. */
function extractNavigate(text: string): { text: string; navigate: ChatMsg['navigate'] } {
  const match = text.match(/\n?NAVIGATE:\s*(\/[^\s|]*)\s*\|\s*([^\n]+)/);
  const full = match?.[0];
  const path = match?.[1];
  const label = match?.[2];
  if (!full || !path || !label) return { text: text.trim(), navigate: null };
  return { text: text.replace(full, '').trim(), navigate: { path, label: label.trim() } };
}

export function ZiyoWidget() {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [mode, setMode] = useState<ChatMode>('default');
  const [language, setLanguage] = useState<PracticeLanguage>('en');
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const supportsVoice = useMemo(() => getSpeechRecognitionCtor() !== null, []);

  useEffect(() => {
    if (!open || messages.length > 0) return;
    let cancelled = false;
    const fallback = () => {
      if (!cancelled) setMessages([{ role: 'assistant', content: greetingFor(pathname) }]);
    };
    // Faqat kirgan foydalanuvchida saqlangan tarix bor — mehmon uchun bu so'rov
    // 401 bilan qaytadi va pastdagi fallback (hozirgi salomlashuv) ishga tushadi.
    fetch('/api/ai/ziyo/messages')
      .then((res) => (res.ok ? res.json() : null))
      .then((history: { role: Role; content: string }[] | null) => {
        if (cancelled) return;
        if (!history || history.length === 0) {
          fallback();
          return;
        }
        setMessages(
          history.map((m) => {
            if (m.role !== 'assistant') return { role: 'user', content: m.content };
            const { text, navigate } = extractNavigate(m.content);
            return { role: 'assistant', content: text, navigate };
          }),
        );
      })
      .catch(fallback);
    return () => {
      cancelled = true;
    };
  }, [open, pathname, messages.length]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  });

  useEffect(() => {
    function onAskZiyo(e: Event) {
      const query = (e as CustomEvent<{ query?: string }>).detail?.query;
      setMode('default');
      setOpen(true);
      if (query) void sendRef.current(query);
    }
    window.addEventListener('imkon:ask-ziyo', onAskZiyo);
    return () => window.removeEventListener('imkon:ask-ziyo', onAskZiyo);
  }, []);

  async function callZiyo(next: ChatMsg[]) {
    setBusy(true);
    try {
      const res = await fetch('/api/ai/ziyo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })).slice(-12),
          page_path: pathname,
          ...(mode === 'practice' ? { mode, language } : {}),
        }),
      });
      if (!res.ok) {
        const isQuota = res.status === 503;
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: isQuota
              ? 'Ziyo hozir judayam ko‘p so‘rov oldi — birozdan so‘ng qayta urinib ko‘ring.'
              : 'Uzr, hozircha javob bera olmadim. Birozdan so‘ng qayta urinib ko‘ring.',
            isError: true,
            isQuotaError: isQuota,
          },
        ]);
        return;
      }
      const data = await res.json();
      const { text, navigate } = extractNavigate(data.content ?? '');
      setMessages((prev) => [...prev, { role: 'assistant', content: text, navigate }]);
      if (mode === 'practice') speak(text, language);
    } finally {
      setBusy(false);
    }
  }

  async function send(content: string) {
    if (!content.trim() || busy) return;
    const next: ChatMsg[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    await callZiyo(next);
  }

  async function retryLast() {
    if (busy) return;
    const withoutError = messages[messages.length - 1]?.isError ? messages.slice(0, -1) : messages;
    if (withoutError.length === 0 || withoutError[withoutError.length - 1]?.role !== 'user') return;
    setMessages(withoutError);
    await callZiyo(withoutError);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void send(input);
  }

  function speak(text: string, lang: PracticeLanguage) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = PRACTICE_LANGUAGES.find((l) => l.key === lang)?.speechLang ?? 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  function switchToDefault() {
    if (mode === 'default') return;
    window.speechSynthesis?.cancel();
    setMode('default');
    setMessages([{ role: 'assistant', content: greetingFor(pathname) }]);
  }

  function switchToPractice(lang: PracticeLanguage) {
    const changed = mode !== 'practice' || language !== lang;
    setMode('practice');
    setLanguage(lang);
    if (changed) {
      window.speechSynthesis?.cancel();
      setMessages([{ role: 'assistant', content: PRACTICE_GREETING[lang] }]);
      speak(PRACTICE_GREETING[lang], lang);
    }
  }

  function toggleVoice() {
    const SpeechRecognitionCtor = getSpeechRecognitionCtor();
    if (!SpeechRecognitionCtor) return;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang =
      mode === 'practice'
        ? (PRACTICE_LANGUAGES.find((l) => l.key === language)?.speechLang ?? 'en-US')
        : 'uz-UZ';
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) setInput(transcript);
    };
    recognition.start();
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="ziyo-panel"
        aria-label={open ? 'Ziyo panelini yopish' : 'Ziyo AI yordamchisini ochish'}
        data-tour="ziyo-trigger"
        className={cn(
          'fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+1.25rem)] right-5 z-[var(--z-ziyo)] flex items-center gap-3 rounded-full py-2.5 pl-2.5 pr-5 md:bottom-5',
          'transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
        )}
        style={{ background: 'var(--navy-900)', border: '1px solid var(--land-line-dark-strong)', boxShadow: 'var(--land-sh-glass)', fontFamily: 'var(--land-font-ui)' }}
      >
        <ZiyoMascot size={44} />
        {!open && (
          <span className="hidden flex-col items-start text-left sm:flex">
            <span className="text-sm font-bold text-white">ZIYO bilan gaplashish</span>
            <span className="text-xs" style={{ color: 'var(--land-teal-300)' }}>
              AI yordamchi · o&apos;zbek tilida
            </span>
          </span>
        )}
      </button>

      {open && (
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => {
            setOpen(false);
            buttonRef.current?.focus();
          }}
          className="fixed inset-0 z-[42] bg-ink/30"
        />
      )}

      {open && (
        <div
          ref={panelRef}
          id="ziyo-panel"
          role="dialog"
          aria-modal="false"
          aria-label="Ziyo AI yordamchisi"
          className="imk-glass fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+6rem)] right-5 z-[var(--z-ziyo)] flex max-h-[70vh] w-[calc(100vw-2.5rem)] max-w-sm flex-col !p-0 md:bottom-24"
          style={{ background: 'linear-gradient(155deg, rgba(30,46,84,0.97), rgba(14,23,45,0.97))' }}
        >
          <div className="flex items-center justify-between gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--land-line-dark)' }}>
            <div className="flex items-center gap-2.5">
              <ZiyoMascot size={38} bob={false} halo={false} />
              <div className="flex flex-col">
                <span className="text-base font-bold text-white">Ziyo</span>
                <span className="flex items-center gap-1.5 text-xs text-white/60">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success" />
                  Onlayn · yordamga tayyor
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                buttonRef.current?.focus();
              }}
              aria-label="Yopish"
              className="flex min-h-touch min-w-touch items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <CloseIcon width={16} height={16} />
            </button>
          </div>

          <div
            className="flex flex-wrap items-center gap-1.5 border-b border-line px-4 py-2"
            role="group"
            aria-label="Suhbat rejimi"
          >
            <button
              type="button"
              onClick={switchToDefault}
              aria-pressed={mode === 'default'}
              className={cn('imk-chip', mode === 'default' && 'imk-chip--active')}
              style={{ cursor: 'pointer', minHeight: 'var(--size-touch)' }}
            >
              Odatiy
            </button>
            {PRACTICE_LANGUAGES.map((l) => (
              <button
                key={l.key}
                type="button"
                onClick={() => switchToPractice(l.key)}
                aria-pressed={mode === 'practice' && language === l.key}
                aria-label={`Til amaliyoti — ${l.label}`}
                className={cn('imk-chip', mode === 'practice' && language === l.key && 'imk-chip--active')}
                style={{ cursor: 'pointer', minHeight: 'var(--size-touch)' }}
              >
                {l.label}
              </button>
            ))}
            {mode === 'practice' && (
              <span className="text-xs" style={{ color: 'var(--land-text-on-dark-dim)' }}>Til amaliyoti</span>
            )}
          </div>

          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-label="Suhbat tarixi"
            className="flex-1 overflow-y-auto px-4 py-3"
          >
            <ul className="flex flex-col gap-3">
              {messages.map((m, i) => (
                <li
                  key={i}
                  className="max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                  style={
                    m.role === 'user'
                      ? { marginLeft: 'auto', borderBottomRightRadius: 5, background: 'var(--land-brand-500)', color: 'var(--land-text-on-dark)' }
                      : m.isError
                        ? { borderBottomLeftRadius: 5, background: 'rgba(217,45,32,0.16)', border: '1px solid rgba(217,45,32,0.4)', color: 'var(--land-text-on-dark)' }
                        : { borderBottomLeftRadius: 5, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.14)', color: 'var(--land-text-on-dark)' }
                  }
                >
                  {m.isError ? (
                    <div className="flex items-start gap-2">
                      <AlertIcon width={16} height={16} className="mt-0.5 shrink-0" />
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                  {m.navigate && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="mt-2"
                      onClick={() => {
                        router.push(m.navigate!.path);
                        setOpen(false);
                      }}
                    >
                      {m.navigate.label}
                      <ChevronRightIcon width={14} height={14} />
                    </Button>
                  )}
                  {m.isError && !m.isQuotaError && i === messages.length - 1 && (
                    <Button type="button" size="sm" variant="secondary" className="mt-2" onClick={() => void retryLast()}>
                      Qayta urinish
                    </Button>
                  )}
                </li>
              ))}
              {busy && (
                <li
                  className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--land-text-on-dark-muted)' }}
                >
                  Ziyo yozmoqda…
                </li>
              )}
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t p-3" style={{ borderColor: 'var(--land-line-dark)' }}>
            <label htmlFor="ziyo-input" className="sr-only">
              Ziyo'ga xabar yozing
            </label>
            <input
              ref={inputRef}
              id="ziyo-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Savolingizni yozing…"
              className="min-h-touch flex-1 rounded-full px-4 text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)' }}
              disabled={busy}
            />
            {supportsVoice && (
              <button
                type="button"
                onClick={toggleVoice}
                aria-pressed={listening}
                aria-label="Ovozli kiritish"
                className="flex min-h-touch min-w-touch items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                style={
                  listening
                    ? { background: 'var(--land-brand-500)', color: 'var(--land-text-on-dark)' }
                    : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', color: 'var(--land-text-on-dark-muted)' }
                }
              >
                <MicIcon width={18} height={18} />
              </button>
            )}
            <Button type="submit" size="sm" disabled={busy || !input.trim()}>
              Yuborish
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
