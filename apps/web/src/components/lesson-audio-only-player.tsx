'use client';

import { useEffect, useState } from 'react';

/** "Faqat audio" rejimi — video o'rniga darsning TTS ovozini ijro etadi (kam
 * internet/ko'zi ojiz foydalanuvchilar uchun). Dars almashganda qayta so'raladi. */
export function LessonAudioOnlyPlayer({ lessonId, title }: { lessonId: number; title: string }) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setAudioUrl(null);
    fetch(`/api/lessons/${lessonId}/audio`, { method: 'POST' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('audio fetch failed'))))
      .then((data: { audio_url: string }) => {
        if (!cancelled) {
          setAudioUrl(data.audio_url);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  return (
    <div className="flex aspect-video flex-col items-center justify-center gap-4 rounded-xl border border-line bg-surface-2 p-6 text-center">
      <span
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-mint text-ink"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M4 9v6h4l5 5V4L8 9H4z" className="fill-current" />
          <path
            d="M16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </span>
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      {status === 'loading' && (
        <p className="font-sans text-sm text-ink-soft">Ovoz tayyorlanmoqda…</p>
      )}
      {status === 'error' && (
        <p className="font-sans text-sm text-error">Ovozni yuklab bo&apos;lmadi. Qaytadan urinib ko&apos;ring.</p>
      )}
      {status === 'ready' && audioUrl && (
        // eslint-disable-next-line jsx-a11y/media-has-caption -- transkript pastda matn sifatida ko'rinadi
        <audio controls autoPlay className="w-full max-w-sm" src={audioUrl}>
          Brauzeringiz audio elementini qo&apos;llab-quvvatlamaydi.
        </audio>
      )}
    </div>
  );
}
