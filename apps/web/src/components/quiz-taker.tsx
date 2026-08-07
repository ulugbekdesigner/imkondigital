'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, cn } from '@imkon/ui';
import { CheckIcon } from '@/components/shell-icons';
import type { QuizAttemptResult, QuizAttemptStart } from '@/lib/types';

function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function SegmentProgress({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current + 1}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn('h-1.5 flex-1 rounded-full', i <= current ? 'bg-primary' : 'bg-surface-2')}
        />
      ))}
    </div>
  );
}

export function QuizTaker({
  quizId,
  title,
  passScorePct,
  questionCount,
  alreadyPassed = false,
  onPassed,
}: {
  quizId: number;
  title: string;
  passScorePct: number;
  questionCount: number;
  alreadyPassed?: boolean;
  onPassed?: () => void;
}) {
  const [attempt, setAttempt] = useState<QuizAttemptStart | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!attempt || attempt.time_limit_seconds == null) return;
    const startedMs = new Date(attempt.started_at).getTime();
    const limitMs = attempt.time_limit_seconds * 1000;
    const tick = () => {
      const left = Math.max(0, Math.round((startedMs + limitMs - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) submit();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [attempt]);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/quizzes/${quizId}/attempts`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? "Testni boshlab bo'lmadi.");
        return;
      }
      setAttempt(data);
      setAnswers({});
      setCurrentIndex(0);
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!attempt || submittingRef.current) return;
    submittingRef.current = true;
    setBusy(true);
    try {
      const ordered = attempt.questions.map((_, i) => answers[i] ?? -1);
      const res = await fetch(`/api/quiz-attempts/${attempt.attempt_id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: ordered }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setAttempt(null);
        if (data.passed) onPassed?.();
      } else {
        setError(data.detail ?? 'Xatolik yuz berdi.');
      }
    } finally {
      setBusy(false);
      submittingRef.current = false;
    }
  }

  if (alreadyPassed && !attempt && !result) {
    return (
      <div className="rounded-lg border border-line bg-mint p-4">
        <p className="flex items-center gap-1.5 font-sans text-base font-medium text-ink">
          <CheckIcon width={16} height={16} className="shrink-0 text-primary" />
          {title} — o'tildi
        </p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="rounded-lg border border-line bg-paper p-4">
        <p className="font-display text-base font-semibold text-ink">{title}</p>
        <p className="mt-2 font-mono text-2xl font-bold text-ink">{result.score_pct}%</p>
        <p className="mt-1 font-sans text-sm text-ink-soft">
          {result.expired
            ? "Vaqt tugadi — urinish hisoblanmadi."
            : result.passed
              ? `O'tdingiz! (${result.pass_score_pct}%+ talab qilinadi)`
              : `O'ta olmadingiz (${result.pass_score_pct}%+ kerak) — qayta urinib ko'ring.`}
        </p>
        {!result.passed && result.review_lesson_titles.length > 0 && (
          <div className="mt-3 rounded border border-line bg-mint p-3">
            <p className="font-sans text-sm font-medium text-ink">
              Qayta urinishdan oldin shu darslarni ko'rib chiqing:
            </p>
            <ul className="mt-1 flex flex-col gap-0.5">
              {result.review_lesson_titles.map((title) => (
                <li key={title} className="font-sans text-sm text-ink-soft">
                  · {title}
                </li>
              ))}
            </ul>
          </div>
        )}
        {!result.passed && (
          <Button type="button" variant="outline" className="mt-3" onClick={start} disabled={busy}>
            Qayta urinish
          </Button>
        )}
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="rounded-lg border border-line bg-paper p-4">
        <p className="font-display text-base font-semibold text-ink">{title}</p>
        <p className="mt-1 font-sans text-sm text-ink-soft">
          {questionCount} savol · {passScorePct}%+ to'g'ri javob kerak
        </p>
        {error && (
          <p role="alert" className="mt-2 font-sans text-sm text-error">
            {error}
          </p>
        )}
        <Button type="button" className="mt-3" onClick={start} disabled={busy}>
          {busy ? 'Yuklanmoqda…' : 'Testni boshlash'}
        </Button>
      </div>
    );
  }

  const question = attempt.questions[currentIndex];
  if (!question) return null;
  const isLast = currentIndex === attempt.questions.length - 1;
  const isFirst = currentIndex === 0;

  return (
    <div className="rounded-lg border border-line bg-paper p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-base font-semibold text-ink">{title}</p>
        {remaining != null && (
          <span
            role="timer"
            className="shrink-0 rounded-full bg-warn-bg px-3 py-1 font-mono text-sm font-semibold text-warn"
            aria-label={`Qolgan vaqt: ${formatSeconds(remaining)}`}
          >
            {formatSeconds(remaining)}
          </span>
        )}
      </div>

      <div className="mt-3">
        <SegmentProgress total={attempt.questions.length} current={currentIndex} />
      </div>
      <p className="mt-2 font-mono text-xs font-bold uppercase tracking-wide text-ink-soft">
        {currentIndex + 1}-savol / {attempt.questions.length} · o'tish bali {passScorePct}%
      </p>

      <p className="mt-3 font-sans text-lg font-bold leading-snug text-ink">{question.prompt}</p>
      <div className="mt-3 flex flex-col gap-2">
        {question.choices.map((choice, ci) => (
          <label
            key={ci}
            className={cn(
              'flex min-h-touch cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 font-sans text-base text-ink transition-colors',
              answers[currentIndex] === ci
                ? 'border-primary bg-mint font-semibold'
                : 'border-line hover:bg-mint/40',
            )}
          >
            <input
              type="radio"
              name={`q-${currentIndex}`}
              checked={answers[currentIndex] === ci}
              onChange={() => setAnswers((prev) => ({ ...prev, [currentIndex]: ci }))}
              className="h-[22px] w-[22px] shrink-0"
            />
            {choice}
          </label>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-2 font-sans text-sm text-error">
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={isFirst || busy}
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
        >
          Orqaga
        </Button>
        {isLast ? (
          <Button
            type="button"
            className="flex-1"
            onClick={submit}
            disabled={busy || Object.keys(answers).length < attempt.questions.length}
          >
            {busy ? 'Yuborilmoqda…' : 'Yakunlash'}
          </Button>
        ) : (
          <Button
            type="button"
            className="flex-1"
            disabled={busy || answers[currentIndex] === undefined}
            onClick={() => setCurrentIndex((i) => Math.min(attempt.questions.length - 1, i + 1))}
          >
            Keyingi savol
          </Button>
        )}
      </div>
    </div>
  );
}
