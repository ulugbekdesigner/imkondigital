'use client';

import { useEffect, useRef, useState } from 'react';
import { cn, ReadAloudButton } from '@imkon/ui';
import { useFlag } from '@/lib/use-feature-flag';

type Status = 'idle' | 'loading' | 'playing' | 'error';

/** voice_tts yoqilgan bo'lsa — Edge-TTS orqali generatsiya qilingan haqiqiy ovoz
 * faylini ijro etadi (server, bir marta yasalib keshlanadi); aks holda brauzerning
 * o'z TTS'iga (ReadAloudButton, Web Speech API) tushadi. */
export function LessonAudioButton({
  lessonId,
  text,
  className,
}: {
  lessonId: number;
  text: string;
  className?: string;
}) {
  const voiceTtsEnabled = useFlag('voice_tts');
  const [status, setStatus] = useState<Status>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  // Dars almashganda oldingi darsning ovozi qolib ketmasligi kerak.
  useEffect(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setStatus('idle');
  }, [lessonId]);

  if (!voiceTtsEnabled) return <ReadAloudButton text={text} className={className} />;

  async function toggle() {
    if (status === 'playing') {
      audioRef.current?.pause();
      setStatus('idle');
      return;
    }
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      setStatus('playing');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch(`/api/lessons/${lessonId}/audio`, { method: 'POST' });
      if (!res.ok) {
        setStatus('error');
        return;
      }
      const data = await res.json();
      const audio = new Audio(data.audio_url);
      audio.onended = () => setStatus('idle');
      audioRef.current = audio;
      await audio.play();
      setStatus('playing');
    } catch {
      setStatus('error');
    }
  }

  const label =
    status === 'loading' ? 'Tayyorlanmoqda…' : status === 'playing' ? "To'xtatish" : "O'qib ber";

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={status === 'loading'}
        aria-pressed={status === 'playing'}
        className={cn(
          'inline-flex min-h-touch items-center gap-1.5 rounded-full border border-line px-3 font-sans text-sm text-ink',
          'hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
          'disabled:opacity-60',
          className,
        )}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 9v6h4l5 5V4L8 9H4z" className="fill-current" />
          {status === 'playing' ? (
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
        {label}
      </button>
      {status === 'error' && (
        <p role="alert" className="font-sans text-xs text-error">
          Ovozni tayyorlab bo&apos;lmadi. Qaytadan urinib ko&apos;ring.
        </p>
      )}
    </div>
  );
}
