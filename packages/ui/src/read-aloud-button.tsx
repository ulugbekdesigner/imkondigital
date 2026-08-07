'use client';

import { useEffect, useState } from 'react';
import { cn } from './lib/cn';

export interface ReadAloudButtonProps {
  text: string;
  className?: string;
}

/** Matnni brauzer TTS orqali ovozda o'qib beradi (ko'zi ojiz/disleksiya
 * foydalanuvchilar uchun) — Web Speech API, qo'shimcha kutubxona kerak emas. */
export function ReadAloudButton({ text, className }: ReadAloudButtonProps) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!supported) return null;

  function toggle() {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'uz-UZ';
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={speaking}
      className={cn(
        'inline-flex min-h-touch items-center gap-1.5 rounded-full border border-line px-3 font-sans text-sm text-ink',
        'hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
        className,
      )}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 9v6h4l5 5V4L8 9H4z" className="fill-current" />
        {speaking ? (
          <path d="M19 8a5 5 0 0 1 0 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        ) : (
          <path
            d="M16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </svg>
      {speaking ? "To'xtatish" : "O'qib ber"}
    </button>
  );
}
