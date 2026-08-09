'use client';

import { type ComponentType, type SVGProps, useState } from 'react';
import { Badge, Button, FileInput } from '@imkon/ui';
import type { FinalAssessmentStatus, QuizPublic } from '@/lib/types';
import { AlertIcon, CheckIcon, RefreshIcon } from '@/components/shell-icons';
import { QuizTaker } from './quiz-taker';

const VERDICT_META: Record<
  string,
  { label: string; Icon: ComponentType<SVGProps<SVGSVGElement>>; variant: 'primary' | 'warn' | 'error' }
> = {
  ready: { label: 'Mustaqil ishlashga tayyor', Icon: CheckIcon, variant: 'primary' },
  needs_practice: { label: 'Amaliyot kerak', Icon: AlertIcon, variant: 'warn' },
  retake: { label: "Kursni qayta ko'rish tavsiya", Icon: RefreshIcon, variant: 'error' },
};

export function FinalExamSection({
  courseId,
  finalQuiz,
  finalExamBrief,
  initialStatus,
}: {
  courseId: number;
  finalQuiz: QuizPublic | null;
  finalExamBrief: string | null;
  initialStatus: FinalAssessmentStatus;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!finalQuiz && !finalExamBrief) return null;

  async function submitFinalExam(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set('text', text);
      if (file) form.set('file', file);
      const res = await fetch(`/api/courses/${courseId}/final-exam-submission`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? 'Topshirishda xatolik yuz berdi.');
        return;
      }
      const statusRes = await fetch(`/api/courses/${courseId}/final-status`);
      setStatus(await statusRes.json());
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold text-ink">Yakuniy baholash</h2>

      {finalQuiz && !status.final_quiz_passed && (
        <QuizTaker
          quizId={finalQuiz.id}
          title={finalQuiz.title}
          passScorePct={finalQuiz.pass_score_pct}
          questionCount={finalQuiz.question_count}
          onPassed={() => setStatus((prev) => ({ ...prev, final_quiz_passed: true }))}
        />
      )}

      {status.final_quiz_passed && finalExamBrief && !status.submission && (
        <div className="rounded-lg border border-line bg-paper p-4">
          <p className="font-sans text-base text-ink">{finalExamBrief}</p>
          <form onSubmit={submitFinalExam} className="mt-3 flex flex-col gap-2">
            <label htmlFor="final-exam-text" className="sr-only">
              Ishingiz haqida yozing
            </label>
            <textarea
              id="final-exam-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Ishingiz haqida yozing…"
              className="w-full rounded border border-line bg-paper px-3 py-2 font-sans text-sm text-ink placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            />
            <FileInput
              aria-label="Fayl biriktirish (ixtiyoriy)"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {error && (
              <p role="alert" className="font-sans text-sm text-error">
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy || !text.trim()} className="self-start">
              {busy ? 'Topshirilmoqda…' : 'Yakuniy imtihonni topshirish'}
            </Button>
          </form>
        </div>
      )}

      {status.submission && (
        <div className="rounded-lg border border-line bg-paper p-4">
          <p className="font-sans text-sm text-ink-soft">Topshirilgan ish:</p>
          <p className="mt-1 whitespace-pre-wrap font-sans text-base text-ink">
            {status.submission.text}
          </p>
          {status.assessment && (
            <div className="mt-4 rounded bg-mint p-3">
              {(() => {
                const meta = VERDICT_META[status.assessment.mentor_verdict ?? status.assessment.ai_verdict];
                return (
                  <Badge variant={meta?.variant ?? 'neutral'}>
                    {meta ? <meta.Icon width={14} height={14} /> : null}
                    {meta?.label ?? status.assessment.mentor_verdict ?? status.assessment.ai_verdict}
                  </Badge>
                );
              })()}
              <p className="mt-2 font-sans text-sm text-ink">
                {status.assessment.mentor_verdict
                  ? status.assessment.mentor_feedback
                  : status.assessment.ai_feedback}
              </p>
              {!status.assessment.mentor_verdict && (
                <p className="mt-2 font-sans text-xs text-ink-soft">
                  AI dastlabki tahlili — ustoz tasdig'ini kutmoqda.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
