'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@imkon/ui';
import { useSpeechDictation } from '@/lib/use-speech-dictation';

type Command = 'next' | 'prev' | 'first' | 'unknown';

function parseCommand(transcript: string): Command {
  const t = transcript.toLowerCase();
  if (t.includes('keyingi')) return 'next';
  if (t.includes('oldingi') || t.includes('orqaga')) return 'prev';
  if (t.includes('birinchi')) return 'first';
  return 'unknown';
}

/** Qo'l band bo'lganda ("keyingi dars", "oldingi dars", "birinchi dars") ovoz
 * bilan darslar orasida o'tish — mavjud useSpeechDictation hookiga qurilgan
 * (Ziyo/Career Coach diktovkasi bilan bir xil brauzer API'si). */
export function LessonVoiceCommandButton({
  onNext,
  onPrev,
  onFirst,
  disabledNext,
  disabledPrev,
}: {
  onNext: () => void;
  onPrev: () => void;
  onFirst: () => void;
  disabledNext: boolean;
  disabledPrev: boolean;
}) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleTranscript(transcript: string) {
    const command = parseCommand(transcript);
    if (command === 'next' && !disabledNext) {
      onNext();
      showFeedback("Keyingi darsga o'tildi");
    } else if (command === 'prev' && !disabledPrev) {
      onPrev();
      showFeedback('Oldingi darsga qaytildi');
    } else if (command === 'first') {
      onFirst();
      showFeedback("Birinchi darsga o'tildi");
    } else {
      showFeedback(`Tushunmadim: "${transcript}"`);
    }
  }

  function showFeedback(text: string) {
    setFeedback(text);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 4000);
  }

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  const { supported, listening, toggle } = useSpeechDictation(handleTranscript);

  if (!supported) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={listening}
        aria-label={listening ? "Ovozli buyruqni tinglash to'xtatildi" : 'Ovozli buyruq berish (masalan: "keyingi dars")'}
        title='Ovozli buyruq: "keyingi dars", "oldingi dars", "birinchi dars"'
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-ink-soft',
          'hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
          listening && 'border-primary bg-primary/10 text-primary',
        )}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="9" y="2" width="6" height="12" rx="3" className="fill-current" />
          <path
            d="M5 11a7 7 0 0 0 14 0M12 18v3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </button>
      {feedback && <p className="font-sans text-xs text-ink-soft">{feedback}</p>}
    </div>
  );
}
