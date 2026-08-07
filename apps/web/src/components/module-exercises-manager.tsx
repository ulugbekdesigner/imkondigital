'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Input } from '@imkon/ui';
import type { AssignmentItem, QuizDetailForInstructor, QuizPublic } from '@/lib/types';

/* Savol turlari (Test konstruktori: savol turlari, ball, vaqt —
   docs/design/README.md 2-bo'lim). Backendda ikkalasi ham bitta choices/correct_index
   sxemasi orqali saqlanadi — "to'g'ri/noto'g'ri" shunchaki 2 ta qat'iy
   variantli bir tanlovli savol, shu sabab yangi migratsiya shart emas. */
const QUESTION_TYPES = [
  { key: 'single', label: 'Bir tanlovli' },
  { key: 'boolean', label: "To'g'ri / Noto'g'ri" },
] as const;
type QuestionType = (typeof QUESTION_TYPES)[number]['key'];

function QuizQuestionForm({ quizId, onAdded }: { quizId: number; onAdded: () => void }) {
  const [questionType, setQuestionType] = useState<QuestionType>('single');
  const [prompt, setPrompt] = useState('');
  const [choices, setChoices] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [booleanCorrectIndex, setBooleanCorrectIndex] = useState(0);
  const [points, setPoints] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function changeType(next: QuestionType) {
    setQuestionType(next);
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const isBoolean = questionType === 'boolean';
    const filled = isBoolean ? ["To'g'ri", "Noto'g'ri"] : choices.map((c) => c.trim()).filter(Boolean);
    if (!isBoolean && filled.length < 2) {
      setError('Kamida 2 ta variant kerak.');
      return;
    }
    let newCorrectIndex: number;
    if (isBoolean) {
      newCorrectIndex = booleanCorrectIndex;
    } else {
      const nonEmptyIndexes = choices.map((c, i) => (c.trim() ? i : -1)).filter((i) => i !== -1);
      newCorrectIndex = nonEmptyIndexes.indexOf(correctIndex);
      if (newCorrectIndex === -1) {
        setError("To'g'ri javobni tanlang.");
        return;
      }
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          choices: filled,
          correct_index: newCorrectIndex,
          points,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? "Qo'shishda xatolik yuz berdi.");
        return;
      }
      setPrompt('');
      setChoices(['', '', '', '']);
      setCorrectIndex(0);
      setBooleanCorrectIndex(0);
      setPoints(1);
      onAdded();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded border border-line p-3">
      <div
        role="radiogroup"
        aria-label="Savol turi"
        className="flex w-fit gap-1 rounded-full bg-surface-2 p-1"
      >
        {QUESTION_TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            role="radio"
            aria-checked={questionType === t.key}
            onClick={() => changeType(t.key)}
            className={`flex min-h-touch items-center rounded-full px-3 font-sans text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 ${
              questionType === t.key ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <label htmlFor={`prompt-${quizId}`} className="sr-only">
        Savol matni
      </label>
      <textarea
        id={`prompt-${quizId}`}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={2}
        placeholder="Savol matni…"
        className="w-full rounded border border-line bg-paper px-3 py-2 font-sans text-sm text-ink placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      />

      {questionType === 'boolean'
        ? ["To'g'ri", "Noto'g'ri"].map((label, i) => (
            <label key={label} className="flex min-h-touch items-center gap-2 font-sans text-sm text-ink">
              <input
                type="radio"
                name={`correct-${quizId}`}
                checked={booleanCorrectIndex === i}
                onChange={() => setBooleanCorrectIndex(i)}
                aria-label={`${label} to'g'ri javob`}
              />
              {label}
            </label>
          ))
        : choices.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-${quizId}`}
                checked={correctIndex === i}
                onChange={() => setCorrectIndex(i)}
                aria-label={`Variant ${i + 1} to'g'ri javob`}
              />
              <Input
                aria-label={`Variant ${i + 1}`}
                placeholder={`Variant ${i + 1}${i < 2 ? '' : ' (ixtiyoriy)'}`}
                value={c}
                onChange={(e) =>
                  setChoices((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                }
              />
            </div>
          ))}

      <label htmlFor={`points-${quizId}`} className="flex items-center gap-2 font-sans text-sm text-ink">
        Ball
        <input
          id={`points-${quizId}`}
          type="number"
          min={1}
          max={100}
          value={points}
          onChange={(e) => setPoints(Math.max(1, Number(e.target.value) || 1))}
          className="min-h-touch w-20 rounded border border-line bg-paper px-2 font-mono text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        />
      </label>

      {error && (
        <p role="alert" className="font-sans text-sm text-error">
          {error}
        </p>
      )}
      <Button type="submit" variant="outline" size="sm" disabled={busy || !prompt.trim()}>
        Savol qo'shish
      </Button>
    </form>
  );
}

export function QuizManager({
  quiz,
  onCreated,
  createLabel,
  createEndpoint,
}: {
  quiz: QuizDetailForInstructor | null;
  onCreated: (quiz: QuizDetailForInstructor) => void;
  createLabel: string;
  createEndpoint: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [passScorePct, setPassScorePct] = useState(70);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState(quiz);

  async function createQuiz(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(createEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          pass_score_pct: passScorePct,
          time_limit_seconds: timeLimitMinutes ? Number(timeLimitMinutes) * 60 : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? "Yaratishda xatolik yuz berdi.");
        return;
      }
      const created: QuizDetailForInstructor = {
        id: data.id,
        kind: createEndpoint.includes('final-quiz') ? 'final_theory' : 'module_check',
        title: data.title,
        pass_score_pct: passScorePct,
        time_limit_seconds: timeLimitMinutes ? Number(timeLimitMinutes) * 60 : null,
        question_count: 0,
        questions: [],
      };
      setDetail(created);
      onCreated(created);
      setShowForm(false);
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    if (!detail) return;
    const res = await fetch(`/api/quizzes/${detail.id}`);
    if (res.ok) {
      const data = await res.json();
      setDetail(data);
      onCreated(data);
    }
  }

  // Kurs sahifasi boshlang'ich yuklashda faqat question_count'ni beradi
  // (ModuleExercisesManager `questions: []` bilan to'ldiradi — yengil kurs
  // ro'yxati so'rovi har bir test uchun to'liq savol matnini olib kelmasin
  // uchun). Shu sabab mavjud savollarni har safar sahifa ochilganda haqiqiy
  // ro'yxat bilan yangilaymiz — aks holda "N savol" ko'rsatkichi to'g'ri,
  // lekin ro'yxat bo'sh ko'rinardi (ustoz savollarini "yo'qolgan" deb o'ylashi
  // mumkin edi).
  // Faqat quiz ID o'zgarganda (masalan yangisi yaratilganda) ishga tushadi —
  // detail.id ga bog'liqlik ataylab shunday, refresh() ni deps'ga qo'shish
  // cheksiz tsiklga olib kelardi (u o'zi setDetail chaqiradi).
  useEffect(() => {
    if (detail && detail.question_count > 0 && detail.questions.length === 0) {
      refresh();
    }
  }, [detail?.id]);

  if (!detail) {
    return showForm ? (
      <form onSubmit={createQuiz} className="flex flex-col gap-2 rounded border border-line p-3">
        <Input
          aria-label="Test nomi"
          placeholder="Test nomi…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex gap-2">
          <div className="flex flex-col gap-1">
            <label
              htmlFor={`pass-score-${createEndpoint}`}
              className="font-sans text-xs text-ink-soft"
            >
              O'tish balli (%)
            </label>
            <Input
              id={`pass-score-${createEndpoint}`}
              type="number"
              min={1}
              max={100}
              value={passScorePct}
              onChange={(e) => setPassScorePct(Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor={`time-limit-${createEndpoint}`}
              className="font-sans text-xs text-ink-soft"
            >
              Vaqt chegarasi (daqiqa, ixtiyoriy)
            </label>
            <Input
              id={`time-limit-${createEndpoint}`}
              type="number"
              min={1}
              value={timeLimitMinutes}
              onChange={(e) => setTimeLimitMinutes(e.target.value)}
            />
          </div>
        </div>
        {error && (
          <p role="alert" className="font-sans text-sm text-error">
            {error}
          </p>
        )}
        <Button type="submit" variant="outline" size="sm" disabled={busy || !title.trim()}>
          Yaratish
        </Button>
      </form>
    ) : (
      <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(true)}>
        {createLabel}
      </Button>
    );
  }

  const totalPoints = detail.questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="flex flex-col gap-2 rounded border border-line p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-sans text-sm font-medium text-ink">{detail.title}</p>
        <div className="flex items-center gap-1.5">
          <Badge variant="neutral">{detail.question_count} savol</Badge>
          {totalPoints > 0 && <Badge variant="neutral">{totalPoints} ball</Badge>}
        </div>
      </div>
      <ul className="flex flex-col gap-1">
        {detail.questions.map((q) => (
          <li key={q.id} className="flex items-baseline justify-between gap-2 font-sans text-xs text-ink-soft">
            <span>
              {q.prompt} — <span className="text-ink">{q.choices[q.correct_index]}</span>
            </span>
            <span className="shrink-0 font-mono text-ink-soft">{q.points} ball</span>
          </li>
        ))}
      </ul>
      <QuizQuestionForm quizId={detail.id} onAdded={refresh} />
    </div>
  );
}

export function ModuleExercisesManager({
  moduleId,
  initialAssignments,
  initialQuiz,
}: {
  moduleId: number;
  initialAssignments: AssignmentItem[];
  initialQuiz: QuizPublic | null;
}) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
  const [quiz, setQuiz] = useState<QuizDetailForInstructor | null>(
    initialQuiz
      ? { ...initialQuiz, questions: [] }
      : null,
  );

  async function addAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!newAssignmentTitle.trim()) return;
    const res = await fetch(`/api/modules/${moduleId}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newAssignmentTitle }),
    });
    if (res.ok) {
      const data = await res.json();
      setAssignments((prev) => [...prev, { id: data.id, title: data.title, description: '', sort: prev.length }]);
      setNewAssignmentTitle('');
    }
  }

  return (
    <div className="ml-6 flex flex-col gap-3 border-l border-line pl-4">
      <div>
        <p className="mb-1 font-sans text-xs font-medium uppercase tracking-wide text-ink-soft">
          Amaliy topshiriqlar
        </p>
        <ul className="mb-2 flex flex-col gap-1">
          {assignments.map((a) => (
            <li key={a.id} className="font-sans text-sm text-ink">
              {a.title}
            </li>
          ))}
        </ul>
        <form onSubmit={addAssignment} className="flex gap-2">
          <Input
            aria-label="Yangi topshiriq nomi"
            placeholder="Yangi topshiriq nomi…"
            value={newAssignmentTitle}
            onChange={(e) => setNewAssignmentTitle(e.target.value)}
          />
          <Button type="submit" variant="outline" size="sm">
            Topshiriq qo'shish
          </Button>
        </form>
      </div>

      <div>
        <p className="mb-1 font-sans text-xs font-medium uppercase tracking-wide text-ink-soft">
          Mini-test
        </p>
        <QuizManager
          quiz={quiz}
          onCreated={setQuiz}
          createLabel="Mini-test qo'shish"
          createEndpoint={`/api/modules/${moduleId}/quiz`}
        />
      </div>
    </div>
  );
}
