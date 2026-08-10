'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, ProgressBar, buttonVariants, cn } from '@imkon/ui';
import {
  ArrowLeftIcon,
  BookIcon,
  CheckIcon,
  ChevronRightIcon,
  ClipboardIcon,
  DownloadIcon,
  LockIcon,
  PlayIcon,
  ShieldIcon,
  SparkIcon,
} from '@/components/shell-icons';
import { formatDate, formatThousands } from '@/lib/format';
import { useFlag } from '@/lib/use-feature-flag';
import { AssignmentSubmission } from './assignment-submission';
import { CelebrationScreen } from './celebration-screen';
import { FinalExamSection } from './final-exam-section';
import { LessonAudioButton } from './lesson-audio-button';
import { LessonAudioOnlyPlayer } from './lesson-audio-only-player';
import { QuizTaker } from './quiz-taker';
import { StudyBuddyPanel } from './study-buddy-panel';
import { VideoPlayer } from './video-player';
import type {
  CourseDetail,
  CourseProgress,
  FinalAssessmentStatus,
  LessonItem,
  Me,
  StudyBuddyMessageOut,
  SubmissionOut,
} from '@/lib/types';

function firstPlayableId(course: CourseDetail): number | null {
  for (const m of course.modules) {
    for (const l of m.lessons) {
      if (l.hls_url) return l.id;
    }
  }
  return course.modules[0]?.lessons[0]?.id ?? null;
}

type PanelTab = 'darslar' | 'ziyo' | 'topshiriq' | 'sertifikat';

const TABS: { key: PanelTab; label: string; icon: typeof BookIcon }[] = [
  { key: 'darslar', label: 'Darslar', icon: BookIcon },
  { key: 'ziyo', label: 'Ziyo', icon: SparkIcon },
  { key: 'topshiriq', label: 'Topshiriq', icon: ClipboardIcon },
  { key: 'sertifikat', label: 'Sertifikat', icon: ShieldIcon },
];

export function CoursePlayer({
  course,
  initialProgress,
  authed,
  initialSubmissions,
  initialFinalStatus,
  me,
}: {
  course: CourseDetail;
  initialProgress: CourseProgress | null;
  authed: boolean;
  initialSubmissions: SubmissionOut[];
  initialFinalStatus: FinalAssessmentStatus | null;
  me: Me | null;
}) {
  const lessons = useMemo(() => course.modules.flatMap((m) => m.lessons), [course]);
  const [selectedId, setSelectedId] = useState<number | null>(() => firstPlayableId(course));
  const [enrolled, setEnrolled] = useState(initialProgress?.enrolled ?? false);
  const [progress, setProgress] = useState(initialProgress?.progress_pct ?? 0);
  const [completed, setCompleted] = useState<Set<number>>(
    new Set(initialProgress?.completed_lesson_ids ?? []),
  );
  const [lockedModuleIds, setLockedModuleIds] = useState<Set<number>>(
    new Set(initialProgress?.locked_module_ids ?? []),
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [certificateUid, setCertificateUid] = useState<string | null>(null);
  const [certificate, setCertificate] = useState(initialProgress?.certificate ?? null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [submissions] = useState(initialSubmissions);
  const [finalStatus, setFinalStatus] = useState(initialFinalStatus);
  const [studyBuddyMessages, setStudyBuddyMessages] = useState<StudyBuddyMessageOut[]>([]);
  const [tab, setTab] = useState<PanelTab>('darslar');
  const [contentTab, setContentTab] = useState<'matn' | 'materiallar'>('matn');
  const voiceTtsEnabled = useFlag('voice_tts');
  const [audioOnly, setAudioOnly] = useState(false);

  useEffect(() => {
    setAudioOnly(localStorage.getItem('imkon-audio-only-mode') === '1');
  }, []);

  function toggleAudioOnly() {
    const next = !audioOnly;
    setAudioOnly(next);
    localStorage.setItem('imkon-audio-only-mode', next ? '1' : '0');
  }

  const selected: LessonItem | undefined = lessons.find((l) => l.id === selectedId);
  const selectedModule = useMemo(
    () => course.modules.find((m) => m.lessons.some((l) => l.id === selectedId)),
    [course, selectedId],
  );
  const nextLesson = useMemo(() => {
    const idx = lessons.findIndex((l) => l.id === selectedId);
    if (idx === -1) return null;
    return lessons[idx + 1] ?? null;
  }, [lessons, selectedId]);

  useEffect(() => {
    if (!enrolled || !selectedId) {
      setStudyBuddyMessages([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/ai/study-buddy/${selectedId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) setStudyBuddyMessages(data);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, enrolled]);

  const submissionsByAssignment = useMemo(() => {
    const map = new Map<number, SubmissionOut>();
    for (const s of submissions) map.set(s.assignment_id, s);
    return map;
  }, [submissions]);

  async function refreshFinalStatus() {
    const res = await fetch(`/api/courses/${course.id}/final-status`);
    if (res.ok) setFinalStatus(await res.json());
  }

  async function enroll() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/courses/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: course.id }),
      });
      if (res.ok) {
        setEnrolled(true);
        setProgress(0);
      } else {
        setMessage('Yozilishda xatolik. Qaytadan urinib ko‘ring.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function markComplete(lessonId: number) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/complete`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setProgress(data.progress_pct);
        setCompleted((prev) => new Set(prev).add(lessonId));
        const progressRes = await fetch(`/api/courses/${course.id}/progress`);
        if (progressRes.ok) {
          const progressData: CourseProgress = await progressRes.json();
          setLockedModuleIds(new Set(progressData.locked_module_ids));
          setCertificate(progressData.certificate);
        }
        if (data.course_completed) {
          setMessage('Tabriklaymiz! Kursni to‘liq yakunladingiz — sertifikatingiz tayyor.');
          setCertificateUid(data.certificate_uid ?? null);
          setShowCelebration(true);
          await refreshFinalStatus();
        }
      } else if (res.status === 403 && typeof data.detail === 'string') {
        setMessage(data.detail);
      } else {
        setMessage('Belgilashda xatolik yuz berdi.');
      }
    } finally {
      setBusy(false);
    }
  }

  const modulesWithExercises = course.modules.filter(
    (m) => m.quiz !== null || m.assignments.length > 0,
  );
  const hasModuleExercises =
    !!selectedModule && (selectedModule.quiz !== null || selectedModule.assignments.length > 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Topbar — joriy dars, moduli, progress va keyingi darsga o'tish */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-3">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/kurslar"
            aria-label="Kurslar katalogiga qaytish"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-ink-soft hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            <ArrowLeftIcon width={18} height={18} />
          </Link>
          <div className="min-w-0">
            <p className="truncate font-sans text-base font-bold text-ink">{course.title}</p>
            {selected && (
              <p className="truncate font-sans text-xs text-ink-soft">
                {selectedModule && `${selectedModule.title} · `}
                {selected.title}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3.5">
          {enrolled && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-2 sm:w-32">
                <div className="h-full rounded-full bg-bright" style={{ width: `${progress}%` }} />
              </div>
              <span className="font-mono text-sm font-semibold tabular-nums text-ink-soft">{progress}%</span>
            </div>
          )}
          {nextLesson && (
            <Button type="button" size="sm" onClick={() => setSelectedId(nextLesson.id)}>
              Keyingi dars
              <ChevronRightIcon width={16} height={16} />
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        {/* Pleer + transkript */}
        <div>
          {voiceTtsEnabled && selected?.transcript && (
            <label className="mb-2 flex items-center justify-end gap-2 font-sans text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={audioOnly}
                onChange={toggleAudioOnly}
                className="h-4 w-4 rounded border-line accent-primary"
              />
              Faqat audio rejimi
            </label>
          )}
          {audioOnly && voiceTtsEnabled && selected?.transcript ? (
            <LessonAudioOnlyPlayer lessonId={selected.id} title={selected.title} />
          ) : selected?.hls_url ? (
            <VideoPlayer
              hlsUrl={selected.hls_url}
              subtitleUrl={selected.subtitle_url}
              title={selected.title}
              watermarkName={enrolled && me ? me.full_name : null}
              watermarkPhone={enrolled && me ? me.phone : null}
            />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-line bg-surface-2 p-6 text-center">
              <p className="font-sans text-base text-ink-soft">
                {selected?.status === 'processing'
                  ? 'Video tayyorlanmoqda — biroz kuting.'
                  : 'Bu dars videosi hali mavjud emas.'}
              </p>
            </div>
          )}

          {selected && (
            <div className="mt-4 flex flex-col gap-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">{selected.title}</h2>
                {selected.description && (
                  <p className="mt-1 font-sans text-base text-ink-soft">{selected.description}</p>
                )}
              </div>

              {enrolled && (
                <Button
                  type="button"
                  onClick={() => markComplete(selected.id)}
                  disabled={busy || completed.has(selected.id)}
                  className="w-fit"
                >
                  {completed.has(selected.id) ? (
                    <>
                      <CheckIcon width={16} height={16} />
                      Bajarildi
                    </>
                  ) : (
                    'Darsni tugatdim'
                  )}
                </Button>
              )}

              {(selected.transcript || selected.materials.length > 0) && (
                <div className="flex flex-col gap-4 rounded-xl border border-line bg-paper p-[22px]">
                  <div role="tablist" aria-label="Dars kontenti" className="flex gap-6 border-b border-surface-2">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={contentTab === 'matn'}
                      onClick={() => setContentTab('matn')}
                      className={cn(
                        'pb-3 font-sans text-sm font-semibold',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
                        contentTab === 'matn' ? 'border-b-2 border-ink text-ink' : 'text-ink-soft hover:text-ink',
                      )}
                    >
                      Dars matni
                    </button>
                    {selected.materials.length > 0 && (
                      <button
                        type="button"
                        role="tab"
                        aria-selected={contentTab === 'materiallar'}
                        onClick={() => setContentTab('materiallar')}
                        className={cn(
                          'pb-3 font-sans text-sm font-semibold',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
                          contentTab === 'materiallar' ? 'border-b-2 border-ink text-ink' : 'text-ink-soft hover:text-ink',
                        )}
                      >
                        Materiallar ({selected.materials.length})
                      </button>
                    )}
                  </div>

                  {contentTab === 'matn' && (
                    selected.transcript ? (
                      <div className="flex max-w-[45rem] flex-col gap-3">
                        <LessonAudioButton
                          lessonId={selected.id}
                          text={selected.transcript}
                          className="self-start"
                        />
                        <p className="whitespace-pre-wrap font-sans text-base leading-relaxed text-ink">
                          {selected.transcript}
                        </p>
                      </div>
                    ) : (
                      <p className="font-sans text-base text-ink-soft">Bu dars uchun matn hali qo&apos;shilmagan.</p>
                    )
                  )}

                  {contentTab === 'materiallar' && selected.materials.length > 0 && (
                    <ul className="flex flex-col gap-1">
                      {selected.materials.map((m) => (
                        <li key={m.id}>
                          <a
                            href={m.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded font-sans text-base text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                          >
                            <DownloadIcon width={16} height={16} />
                            {m.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Yon panel — Darslar / Ziyo / Topshiriq tab'lari */}
        <div className="flex flex-col rounded-xl border border-line bg-paper lg:sticky lg:top-6">
          <div role="tablist" aria-label="Dars paneli" className="flex border-b border-surface-2">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    'flex min-h-touch flex-1 items-center justify-center gap-1.5 border-b-2 px-2 font-sans text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset',
                    'motion-reduce:transition-none',
                    tab === t.key
                      ? 'border-ink text-ink'
                      : 'border-transparent text-ink-soft hover:text-ink',
                  )}
                >
                  <Icon width={16} height={16} />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="p-4">
            {tab === 'darslar' && (
              <div className="flex flex-col gap-4">
                {!authed ? (
                  <div className="rounded-xl border border-line bg-surface-2 p-4">
                    <p className="font-sans text-base text-ink">
                      Kursni boshlash uchun tizimga kiring.
                    </p>
                    <Link
                      href={`/kirish?next=/kurslar/${course.slug}`}
                      className={cn(buttonVariants({ size: 'md' }), 'mt-3')}
                    >
                      Kirish
                    </Link>
                  </div>
                ) : !enrolled ? (
                  <div className="rounded-xl border border-line bg-surface-2 p-4">
                    <p className="font-sans text-base text-ink">
                      {course.is_free
                        ? 'Bepul kurs — hoziroq boshlang.'
                        : `Narx: ${formatThousands(course.price)} so‘m`}
                    </p>
                    <Button type="button" onClick={enroll} disabled={busy} className="mt-3 w-full">
                      {busy ? 'Yozilmoqda…' : 'Kursga yozilish'}
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-line bg-surface-2 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-sm font-medium text-ink">Progress</span>
                      <span className="font-mono text-sm text-primary">{progress}%</span>
                    </div>
                    <ProgressBar value={progress} label="Kurs progressi" className="mt-2" />
                  </div>
                )}

                {message && (
                  <div role="status" className="rounded-xl border border-line bg-surface-2 p-3">
                    <p className="font-sans text-sm text-ink">{message}</p>
                    {certificateUid && (
                      <Link
                        href={`/verify/${certificateUid}`}
                        className="mt-1 inline-flex items-center gap-1 rounded font-sans text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                      >
                        Sertifikatni ko'rish
                        <ChevronRightIcon width={14} height={14} />
                      </Link>
                    )}
                  </div>
                )}

                {course.modules.length === 0 && (
                  <div className="imk-empty">
                    <span aria-hidden="true" className="imk-empty__icon">
                      <BookIcon width={22} height={22} />
                    </span>
                    <p className="font-sans text-sm text-ink">
                      Bu kursga hali darslar qo'shilmagan.
                    </p>
                  </div>
                )}

                <nav aria-label="Darslar" className="flex flex-col gap-4">
                  {course.modules.map((m) => {
                    const isModuleLocked = lockedModuleIds.has(m.id);
                    return (
                      <div key={m.id}>
                        <h3 className="mb-2 flex items-center gap-1.5 font-sans text-xs font-bold uppercase tracking-wide text-ink-soft">
                          {m.title}
                          {isModuleLocked && (
                            <span
                              aria-hidden="true"
                              className="flex h-4 w-4 items-center justify-center text-ink-soft"
                            >
                              <LockIcon width={12} height={12} />
                            </span>
                          )}
                        </h3>
                        <ul className="flex flex-col gap-1">
                          {m.lessons.map((l) => {
                            const isSelected = l.id === selectedId;
                            const isDone = completed.has(l.id);
                            return (
                              <li key={l.id}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedId(l.id)}
                                  aria-current={isSelected ? 'true' : undefined}
                                  title={
                                    isModuleLocked && !isDone
                                      ? "Bu modul hali qulflangan — oldingi modulni yakunlang"
                                      : undefined
                                  }
                                  className={cn(
                                    'flex min-h-touch w-full items-center gap-2 rounded-lg border px-3 text-left font-sans text-sm transition-colors',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
                                    'motion-reduce:transition-none',
                                    isSelected
                                      ? 'border-bright bg-bright/10 text-ink'
                                      : 'border-transparent text-ink-soft hover:bg-surface-2 hover:text-ink',
                                  )}
                                >
                                  <span
                                    aria-hidden="true"
                                    className={cn(
                                      'flex h-5 w-5 shrink-0 items-center justify-center',
                                      isDone
                                        ? 'text-primary'
                                        : isModuleLocked
                                          ? 'text-ink-soft'
                                          : 'text-ink-soft',
                                    )}
                                  >
                                    {isDone ? (
                                      <CheckIcon width={14} height={14} />
                                    ) : isModuleLocked ? (
                                      <LockIcon width={12} height={12} />
                                    ) : (
                                      <PlayIcon width={12} height={12} />
                                    )}
                                  </span>
                                  <span className="flex-1 truncate">{l.title}</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </nav>

                {enrolled && (
                  <div
                    className="mt-auto flex flex-col gap-2.5 rounded-2xl p-4"
                    style={{ background: 'radial-gradient(320px 160px at 100% 0%, rgb(var(--imkon-teal) / 0.24), transparent 62%), linear-gradient(150deg, var(--surface-dark), var(--surface-dark-2))' }}
                  >
                    <span className="font-sans text-sm font-bold text-white">ZIYO: tushunmagan joyingiz bormi?</span>
                    <p className="font-sans text-xs leading-relaxed text-mist">
                      Shu darsning istalgan qismini sodda tilda tushuntiraman.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setTab('ziyo')}
                      className="bg-paper text-ink hover:brightness-95"
                    >
                      Savol berish
                    </Button>
                  </div>
                )}
              </div>
            )}

            {tab === 'ziyo' && (
              <div>
                {enrolled && selectedId ? (
                  <StudyBuddyPanel
                    key={selected?.id}
                    lessonId={selectedId}
                    initialMessages={studyBuddyMessages}
                  />
                ) : (
                  <p className="font-sans text-sm text-ink-soft">
                    Ziyo bilan shu dars haqida suhbatlashish uchun kursga yoziling.
                  </p>
                )}
              </div>
            )}

            {tab === 'topshiriq' && (
              <div className="flex flex-col gap-4">
                {!enrolled ? (
                  <p className="font-sans text-sm text-ink-soft">
                    Topshiriqlarni ko'rish uchun kursga yoziling.
                  </p>
                ) : !hasModuleExercises ? (
                  <p className="font-sans text-sm text-ink-soft">Bu modulda topshiriq yo'q.</p>
                ) : (
                  selectedModule && (
                    <>
                      {selectedModule.quiz && (
                        <QuizTaker
                          quizId={selectedModule.quiz.id}
                          title={selectedModule.quiz.title}
                          passScorePct={selectedModule.quiz.pass_score_pct}
                          questionCount={selectedModule.quiz.question_count}
                        />
                      )}
                      {selectedModule.assignments.map((a) => (
                        <AssignmentSubmission
                          key={a.id}
                          assignmentId={a.id}
                          title={a.title}
                          description={a.description}
                          initialSubmission={submissionsByAssignment.get(a.id) ?? null}
                        />
                      ))}
                    </>
                  )
                )}
              </div>
            )}

            {tab === 'sertifikat' && (
              <div className="flex flex-col gap-4">
                {!authed || !enrolled ? (
                  <div className="imk-locked">
                    <LockIcon width={20} height={20} aria-hidden="true" />
                    <p className="font-sans text-sm">
                      Sertifikat kursga yozilib, uni to'liq yakunlaganingizdan so'ng shu yerda
                      paydo bo'ladi.
                    </p>
                  </div>
                ) : certificate ? (
                  <div className="flex flex-col gap-4 rounded-xl border border-line bg-paper p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bright/15 text-primary">
                        <ShieldIcon width={22} height={22} aria-hidden="true" />
                      </span>
                      <div>
                        <p className="font-sans text-sm font-semibold text-ink">
                          {course.title} sertifikati
                        </p>
                        <p className="font-mono text-xs text-ink-soft">
                          {formatDate(certificate.issued_at)} berilgan
                        </p>
                      </div>
                    </div>
                    {certificate.confirmed_at ? (
                      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--ok-soft)] px-2.5 py-1 font-sans text-xs font-semibold text-[var(--ok-text)]">
                        <CheckIcon width={12} height={12} aria-hidden="true" />
                        Ustoz tomonidan tasdiqlangan
                      </span>
                    ) : (
                      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 font-sans text-xs font-medium text-ink-soft">
                        Tasdiqlash kutilmoqda
                      </span>
                    )}
                    <div className="flex flex-wrap gap-2.5">
                      <Link
                        href={`/verify/${certificate.uid}`}
                        className={buttonVariants({ size: 'md' })}
                      >
                        Sertifikatni ko'rish
                        <ChevronRightIcon width={14} height={14} aria-hidden="true" />
                      </Link>
                      {certificate.pdf_url && (
                        <a
                          href={certificate.pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(
                            buttonVariants({ variant: 'outline', size: 'md' }),
                            'border border-line text-ink hover:bg-surface-2',
                          )}
                        >
                          <DownloadIcon width={14} height={14} aria-hidden="true" />
                          PDF
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="imk-locked">
                    <LockIcon width={20} height={20} aria-hidden="true" />
                    <p className="font-sans text-sm">
                      Sertifikat hali qulflangan — kursni 100% yakunlaganingizda avtomatik
                      beriladi. Joriy progress: {progress}%.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {enrolled && modulesWithExercises.length > 0 && (
        <div className="flex flex-col gap-6">
          <h2 className="font-display text-lg font-semibold text-ink">
            Barcha mashqlar va topshiriqlar
          </h2>
          {modulesWithExercises.map((m) => (
            <div key={m.id} className="flex flex-col gap-4">
              <h3 className="font-display text-base font-semibold text-ink">{m.title}</h3>
              {m.quiz && (
                <QuizTaker
                  quizId={m.quiz.id}
                  title={m.quiz.title}
                  passScorePct={m.quiz.pass_score_pct}
                  questionCount={m.quiz.question_count}
                />
              )}
              {m.assignments.map((a) => (
                <AssignmentSubmission
                  key={a.id}
                  assignmentId={a.id}
                  title={a.title}
                  description={a.description}
                  initialSubmission={submissionsByAssignment.get(a.id) ?? null}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {enrolled && progress === 100 && finalStatus && (
        <FinalExamSection
          courseId={course.id}
          finalQuiz={course.final_quiz}
          finalExamBrief={course.final_exam_brief}
          initialStatus={finalStatus}
        />
      )}

      {showCelebration && (
        <CelebrationScreen
          variant="oquvchi"
          title="Kursni tugatdingiz!"
          message={certificateUid ? `"${course.title}" sertifikati tayyor.` : `"${course.title}" muvaffaqiyatli yakunlandi.`}
          actionLabel={certificateUid ? 'Sertifikatni koʻrish' : undefined}
          actionHref={certificateUid ? `/verify/${certificateUid}` : undefined}
          onDismiss={() => setShowCelebration(false)}
        />
      )}
    </div>
  );
}
