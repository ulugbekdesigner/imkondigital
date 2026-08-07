'use client';

import { useState } from 'react';
import { Button } from '@imkon/ui';
import type { QuizDetailForInstructor, QuizPublic } from '@/lib/types';
import { QuizManager } from './module-exercises-manager';

export function CourseFinalAssessmentManager({
  courseId,
  initialFinalExamBrief,
  initialFinalQuiz,
}: {
  courseId: number;
  initialFinalExamBrief: string | null;
  initialFinalQuiz: QuizPublic | null;
}) {
  const [brief, setBrief] = useState(initialFinalExamBrief ?? '');
  const [savedBrief, setSavedBrief] = useState(initialFinalExamBrief);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalQuiz, setFinalQuiz] = useState<QuizDetailForInstructor | null>(
    initialFinalQuiz ? { ...initialFinalQuiz, questions: [] } : null,
  );

  async function saveBrief(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/final-exam-brief`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ final_exam_brief: brief }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? 'Saqlashda xatolik yuz berdi.');
        return;
      }
      setSavedBrief(data.final_exam_brief);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 flex flex-col gap-4 rounded-lg border border-line bg-mint/20 p-4">
      <h2 className="font-display text-lg font-semibold text-ink">
        Yakuniy baholash (B3) — kurs darajasida
      </h2>

      <div>
        <p className="mb-1 font-sans text-xs font-medium uppercase tracking-wide text-ink-soft">
          Yakuniy nazariy test
        </p>
        <QuizManager
          quiz={finalQuiz}
          onCreated={setFinalQuiz}
          createLabel="Yakuniy test qo'shish"
          createEndpoint={`/api/courses/${courseId}/final-quiz`}
        />
      </div>

      <div>
        <p className="mb-1 font-sans text-xs font-medium uppercase tracking-wide text-ink-soft">
          Yakuniy amaliy imtihon sharti
        </p>
        <form onSubmit={saveBrief} className="flex flex-col gap-2">
          <label htmlFor={`brief-${courseId}`} className="sr-only">
            Yakuniy imtihon topshirig'i matni
          </label>
          <textarea
            id={`brief-${courseId}`}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={3}
            placeholder="O'quvchi yakunda bajarishi kerak bo'lgan real vazifani tasvirlab bering…"
            className="w-full rounded border border-line bg-paper px-3 py-2 font-sans text-sm text-ink placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          />
          {error && (
            <p role="alert" className="font-sans text-sm text-error">
              {error}
            </p>
          )}
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={busy || brief.trim().length < 10}
            className="self-start"
          >
            Saqlash
          </Button>
          {savedBrief && <p className="font-sans text-xs text-ink-soft">Saqlangan: {savedBrief}</p>}
        </form>
      </div>
    </section>
  );
}
