import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Badge, GlassCard, ProgressBar, buttonVariants } from '@imkon/ui';
import { getMe, getTrajectory } from '@/lib/server-api';
import { TrajectoryLadder } from '@/components/trajectory-ladder';
import { ChevronRightIcon, RouteIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Mening trayektoriyam',
  description: '15 bosqichli raqamli karyera yo\'lingiz.',
};

export default async function TrajectoryPage() {
  const [me, trajectory] = await Promise.all([getMe(), getTrajectory()]);
  if (!me || !trajectory) {
    redirect('/kirish?next=/trayektoriya');
  }

  const totalSteps = trajectory.steps.length;
  const currentStep = trajectory.steps.find((s) => s.number === trajectory.current_step);
  // Bosqichlar chiziqli emas (backend/core/trajectory.py) — "current_step + 1"
  // allaqachon bajarilgan bo'lishi mumkin. Haqiqiy keyingi qadam — raqami
  // bo'yicha eng kichik "locked" bosqich (backend `not_done[1:]`ga mos).
  const nextStep = [...trajectory.steps]
    .filter((s) => s.status === 'locked')
    .sort((a, b) => a.number - b.number)[0];
  const doneCount = trajectory.steps.filter((s) => s.status === 'done').length;

  return (
    <div className="relative mx-auto max-w-2xl overflow-hidden px-4 py-10">
      <div
        aria-hidden="true"
        className="bg-dot-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]"
      />

      <h1 className="font-display text-2xl font-bold text-ink">Mening trayektoriyam</h1>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge variant="primary">
          <RouteIcon width={14} height={14} />
          Faza {currentStep?.phase} · Qadam {trajectory.current_step}/{totalSteps}
        </Badge>
      </div>
      <p className="mt-3 font-sans text-base text-ink-soft">
        Salom, {me.full_name}. Hozirgi qadam: <strong className="text-ink">{currentStep?.title}</strong>.
      </p>

      <div className="mt-5">
        <ProgressBar
          value={totalSteps > 0 ? (doneCount / totalSteps) * 100 : 0}
          label={`Trayektoriya progressi — ${doneCount}/${totalSteps} bosqich bajarildi`}
        />
        <p className="mt-1.5 font-mono text-xs text-ink-soft">
          {doneCount}/{totalSteps} bosqich bajarildi
        </p>
      </div>

      {nextStep && (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-dashed border-line bg-mint/40 p-4">
          <span
            aria-hidden="true"
            className="flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-full border-2 border-bright bg-paper font-mono text-base font-bold text-bright"
          >
            {nextStep.number}
          </span>
          <div className="flex flex-col">
            <span className="font-mono text-xs uppercase tracking-widest text-ink-soft">
              Keyingi qadam
            </span>
            <span className="font-sans text-base font-medium text-ink">{nextStep.title}</span>
          </div>
          <ChevronRightIcon className="ml-auto shrink-0 text-ink-soft" />
        </div>
      )}

      <GlassCard className="mt-6 p-6">
        <TrajectoryLadder trajectory={trajectory} />
      </GlassCard>

      <div className="mt-6">
        <Link href="/profil" className={buttonVariants({ variant: 'outline' })}>
          Profilga o'tish
        </Link>
      </div>
    </div>
  );
}
