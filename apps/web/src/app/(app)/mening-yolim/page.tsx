import type { ComponentType, SVGProps } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Badge, buttonVariants, Card, cn, ProgressBar } from '@imkon/ui';
import { getMe } from '@/lib/server-api';
import { getLearningHome, getMyStreak } from '@/lib/learning-home-api';
import { getMyPortfolio } from '@/lib/passport-api';
import { getMyApplications, getVacancyCatalog } from '@/lib/employer-api';
import { getMyNotifications } from '@/lib/notifications-api';
import { RevealGroup, RevealItem } from '@/components/reveal';
import { TrajectoryLadder } from '@/components/trajectory-ladder';
import { MatchedVacanciesCard } from '@/components/matched-vacancies-card';
import { NotificationsPreviewCard } from '@/components/notifications-preview-card';
import { AlertIcon, BookIcon, CheckIcon, ChevronRightIcon, RouteIcon, SparkIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Mening yo\'lim',
  description: "Bugungi vazifangiz, kurslardagi progressingiz va mentor xabarlari bitta ekranda.",
  robots: { index: false },
};

const VERDICT_META: Record<
  string,
  { label: string; Icon: ComponentType<SVGProps<SVGSVGElement>>; variant: 'primary' | 'warn' }
> = {
  ready: { label: 'Mustaqil ishlashga tayyor', Icon: CheckIcon, variant: 'primary' },
  needs_practice: { label: 'Amaliyot kerak', Icon: AlertIcon, variant: 'warn' },
  retake: { label: "Kursni qayta ko'rish tavsiya", Icon: AlertIcon, variant: 'warn' },
};

const ACTIVE_APPLICATION_STATUSES = ['submitted', 'viewed', 'interview'];

function KpiCard({
  icon: Icon,
  value,
  label,
  hint,
  hintClassName,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  value: string;
  label: string;
  hint?: string;
  hintClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-card border border-line bg-paper p-[18px]">
      <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-lg bg-mint text-primary">
        <Icon width={18} height={18} />
      </span>
      <span className="font-mono text-2xl font-bold tabular-nums text-ink">{value}</span>
      <span className="font-sans text-xs font-bold uppercase tracking-wide text-ink-soft">{label}</span>
      {hint && <span className={cn('font-sans text-xs text-ink-soft', hintClassName)}>{hint}</span>}
    </div>
  );
}

function StreakBar({ days }: { days: number }) {
  const filled = Math.max(0, Math.min(7, days));
  return (
    <div className="flex gap-1">
      {Array.from({ length: 7 }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn('h-2 flex-1 rounded-full', i < filled ? 'bg-gold' : 'bg-surface-2')}
        />
      ))}
    </div>
  );
}

export default async function MeningYolimPage() {
  const [me, home, streak, portfolio, applications, vacancyPage, notifications] = await Promise.all([
    getMe(),
    getLearningHome(),
    getMyStreak(),
    getMyPortfolio(),
    getMyApplications(),
    getVacancyCatalog({}),
    getMyNotifications(),
  ]);
  if (!me || !home) redirect('/kirish?next=/mening-yolim');

  const currentStep = home.trajectory.steps.find(
    (s) => s.number === home.trajectory.current_step,
  );
  const nextLessonEnrollment = home.next_lesson
    ? home.active_enrollments.find((e) => e.course_slug === home.next_lesson!.course_slug)
    : undefined;
  const activeApplications = applications.filter((a) => ACTIVE_APPLICATION_STATUSES.includes(a.status));
  const interviewCount = applications.filter((a) => a.status === 'interview').length;
  const matchedVacancies = vacancyPage.items
    .filter((v) => v.match_score !== null)
    .sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))
    .slice(0, 2);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Bugungi vazifa — quyuq hero karta (4d-blok) */}
      <RevealGroup>
        <RevealItem>
          <section
            data-tour="today-task"
            className="relative flex flex-col gap-3.5 overflow-hidden rounded-[22px] border border-white/10 px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8"
            style={{ background: 'radial-gradient(420px 200px at 100% 0%, rgb(var(--imkon-teal) / 0.22), transparent 62%), linear-gradient(150deg, var(--surface-dark), var(--surface-dark-2))' }}
          >
            <div className="relative flex flex-col gap-2">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-mist">Bugungi vazifa</p>
              {home.next_lesson ? (
                <>
                  <h1 className="max-w-lg font-display text-xl font-bold leading-tight text-deep-fg sm:text-2xl">
                    {home.next_lesson.lesson_title}
                  </h1>
                  <p className="max-w-md font-sans text-base text-mist">{home.next_lesson.course_title}</p>
                  {nextLessonEnrollment && (
                    <div className="mt-1 flex max-w-xs items-center gap-3">
                      <ProgressBar
                        value={nextLessonEnrollment.progress_pct}
                        label={`${nextLessonEnrollment.course_title} — ${nextLessonEnrollment.progress_pct}% tugallandi`}
                        surface="dark"
                        className="flex-1"
                      />
                      <span className="shrink-0 font-mono text-xs tabular-nums text-mist">
                        {nextLessonEnrollment.progress_pct}%
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h1 className="max-w-lg font-display text-xl font-bold leading-tight text-deep-fg sm:text-2xl">
                    Hozircha faol darsingiz yo&apos;q
                  </h1>
                  <p className="max-w-md font-sans text-base text-mist">
                    Kurslar katalogidan birini tanlang — bugungi vazifangiz shu yerda paydo bo&apos;ladi.
                  </p>
                </>
              )}
            </div>
            <div className="relative flex shrink-0 items-center gap-3">
              <Link
                href="/trayektoriya"
                className={cn(
                  buttonVariants({ size: 'md' }),
                  'border border-white/25 bg-transparent text-white hover:bg-white/10 hover:brightness-100 focus-visible:ring-offset-deep',
                )}
              >
                Rejani ko&apos;rish
              </Link>
              <Link
                href={home.next_lesson ? `/kurslar/${home.next_lesson.course_slug}` : '/kurslar'}
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'bg-paper text-ink hover:brightness-95 focus-visible:ring-offset-deep',
                )}
              >
                {home.next_lesson ? "Darsni davom ettirish" : "Kurslarni ko'rish"}
                <ChevronRightIcon width={16} height={16} aria-hidden="true" />
              </Link>
            </div>
          </section>
        </RevealItem>
      </RevealGroup>

      {/* KPI qatori */}
      <RevealGroup className="mt-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <RevealItem>
          <KpiCard
            icon={RouteIcon}
            value={String(home.trajectory.current_step)}
            label="Narvon"
            hint={currentStep?.title}
          />
        </RevealItem>
        <RevealItem>
          <div className="flex flex-col gap-2 rounded-card border border-line bg-paper p-[18px]">
            <span className="font-sans text-xs font-bold uppercase tracking-wide text-ink-soft">Streak</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-bold tabular-nums text-ink">{streak?.current_streak ?? 0}</span>
              <span className="font-sans text-sm text-ink-soft">kun</span>
            </div>
            <StreakBar days={streak?.current_streak ?? 0} />
          </div>
        </RevealItem>
        <RevealItem>
          <div className="flex flex-col gap-2 rounded-card border border-line bg-paper p-[18px]">
            <span className="font-sans text-xs font-bold uppercase tracking-wide text-ink-soft">Portfolio</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-bold tabular-nums text-ink">{portfolio.length}</span>
              <span className="font-sans text-sm text-ink-soft">ish namunasi</span>
            </div>
            <Link href="/profil#yutuqlarim" className="inline-flex items-center gap-0.5 font-sans text-xs font-semibold text-primary underline-offset-4 hover:underline">
              Yangisini qo&apos;shish
              <ChevronRightIcon width={13} height={13} aria-hidden="true" />
            </Link>
          </div>
        </RevealItem>
        <RevealItem>
          <div className="flex flex-col gap-2 rounded-card border border-line bg-paper p-[18px]">
            <span className="font-sans text-xs font-bold uppercase tracking-wide text-ink-soft">Arizalarim</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-bold tabular-nums text-ink">{activeApplications.length}</span>
              <span className="font-sans text-sm text-ink-soft">faol</span>
            </div>
            {interviewCount > 0 && (
              <span className="self-start rounded-full bg-warn-bg px-2.5 py-1 font-sans text-xs font-semibold text-warn">
                {interviewCount} ta suhbatda
              </span>
            )}
          </div>
        </RevealItem>
      </RevealGroup>

      {/* Pastki blok */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-3.5 rounded-xl border border-line bg-paper p-[22px]">
            <span className="font-display text-md font-bold text-ink">Davom etayotgan kurslarim</span>
            {home.active_enrollments.length > 0 ? (
              home.active_enrollments.map((e) => (
                <div key={e.course_id} className="flex min-w-0 flex-col gap-3 rounded-2xl border border-line p-3.5 sm:flex-row sm:items-center">
                  <div
                    aria-hidden="true"
                    className="hidden h-11 w-11 shrink-0 rounded-2xl sm:block"
                    style={{ background: 'linear-gradient(140deg, rgb(var(--imkon-bright)), rgb(var(--imkon-teal) / 0.5))' }}
                  />
                  <span className="flex-1 truncate font-sans text-base font-bold text-ink">{e.course_title}</span>
                  <div className="flex w-full items-center gap-3 sm:w-32 sm:flex-col sm:items-stretch sm:gap-1.5">
                    <ProgressBar value={e.progress_pct} label={`${e.course_title} — ${e.progress_pct}% tugallandi`} className="flex-1" />
                    <span className="shrink-0 font-mono text-xs tabular-nums text-ink-soft">{e.progress_pct}%</span>
                  </div>
                  <Link
                    href={`/kurslar/${e.course_slug}`}
                    className={cn(buttonVariants({ size: 'sm' }), 'w-full sm:w-auto')}
                  >
                    Davom
                  </Link>
                </div>
              ))
            ) : (
              <div className="imk-empty">
                <span aria-hidden="true" className="imk-empty__icon">
                  <BookIcon width={22} height={22} />
                </span>
                <div className="flex flex-col gap-1">
                  <p className="font-sans text-base font-bold text-ink">Hali faol kursingiz yo&apos;q</p>
                  <p className="font-sans text-sm text-ink-soft">
                    Kurslar katalogidan birini tanlang — progressingiz shu yerda ko&apos;rinadi.
                  </p>
                </div>
                <Link
                  href="/kurslar"
                  className={cn(buttonVariants({ size: 'sm' }))}
                >
                  Kurslar katalogi
                </Link>
              </div>
            )}
          </div>

          <MatchedVacanciesCard vacancies={matchedVacancies} />

          {home.recent_assessment_results.length > 0 && (
            <div className="flex flex-col gap-3 rounded-xl border border-line bg-paper p-[22px]">
              <span className="font-display text-md font-bold text-ink">Yakuniy baholash natijalari</span>
              <ul className="flex flex-col gap-2">
                {home.recent_assessment_results.map((r, i) => {
                  const meta = VERDICT_META[r.verdict];
                  return (
                    <li
                      key={i}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line p-3"
                    >
                      <span className="font-sans text-base text-ink">{r.course_title}</span>
                      <Badge variant={meta?.variant ?? 'neutral'}>
                        {meta ? <meta.Icon width={14} height={14} /> : null}
                        {meta?.label ?? r.verdict}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <section className="relative overflow-hidden rounded-xl bg-deep p-5">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal/20 blur-3xl"
            />
            <div className="relative flex items-start gap-3">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-deep-fg/10 text-teal"
              >
                <SparkIcon width={20} height={20} />
              </span>
              <div>
                <p className="font-display text-base font-semibold text-deep-fg">ZIYO maslahati</p>
                <p className="mt-1 font-sans text-sm text-mist">
                  Keyingi qadam haqida shubhangiz bormi? Ziyo sizga mos kasb yo&apos;nalishi va karyera
                  rejasini tushuntirib beradi.
                </p>
              </div>
            </div>
            <Link
              href="/karyera-kochi"
              className={cn(
                buttonVariants({ size: 'sm' }),
                'relative mt-4 bg-paper text-ink hover:brightness-95 focus-visible:ring-offset-deep',
              )}
            >
              Ziyo bilan suhbatlashish
            </Link>
          </section>

          <NotificationsPreviewCard items={notifications.items} unreadCount={notifications.unread_count} />

          {home.latest_mentor_note && (
            <Card className="p-4">
              <p className="font-sans text-sm text-ink-soft">
                Mentordan xabar — {home.latest_mentor_note.mentor_name}
              </p>
              <p className="mt-1 font-sans text-base text-ink">{home.latest_mentor_note.note}</p>
            </Card>
          )}
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-ink">Trayektoriya</h2>
        <Card className="mt-3 p-6">
          <TrajectoryLadder trajectory={home.trajectory} />
        </Card>
      </section>

      <div className="mt-8 flex flex-wrap gap-3 border-t border-line pt-6">
        <Link
          href="/karyera-kochi"
          className={cn(
            buttonVariants({ size: 'md' }),
            'border border-line bg-transparent text-ink hover:bg-surface-2 hover:brightness-100',
          )}
        >
          AI Career Coach
        </Link>
        <Link
          href="/trayektoriya"
          className={cn(
            buttonVariants({ size: 'md' }),
            'border border-line bg-transparent text-ink hover:bg-surface-2 hover:brightness-100',
          )}
        >
          To&apos;liq trayektoriya
        </Link>
      </div>
    </div>
  );
}
