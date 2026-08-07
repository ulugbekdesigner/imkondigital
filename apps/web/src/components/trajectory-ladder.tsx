import { cn } from '@imkon/ui';
import { CheckIcon } from '@/components/shell-icons';
import type { Trajectory, TrajectoryStep } from '@/lib/types';

const PHASE_NAMES: Record<string, string> = {
  A: 'Kirish',
  B: "O'sish",
  C: 'Qo’llab-quvvatlash',
  D: 'Daromad',
  E: 'Yetakchilik',
};

function statusLabel(status: TrajectoryStep['status']): string {
  return status === 'done' ? 'Bajarildi' : status === 'current' ? 'Hozirgi qadam' : 'Ochilmagan';
}

function Rung({ step, isNext }: { step: TrajectoryStep; isNext: boolean }) {
  // "Keyingi qadam" — ro'yxatdagi eng yaqin ochilmagan bosqich boshqa
  // qulflangan bosqichlardan ajratilgan (chiziqli chegara + fon), qolganlari
  // xiralashtirilgan (IMKON Interface.dc.html 4r-blok andozasi).
  if (isNext) {
    return (
      <li className="flex items-start gap-3 rounded-2xl border border-dashed border-bright bg-mint/40 p-3.5">
        <span
          className="flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded border-2 border-bright font-mono text-base font-bold text-primary"
          aria-hidden="true"
        >
          {step.number}
        </span>
        <div className="flex flex-col gap-0.5 pt-1.5">
          <span className="font-sans text-xs font-bold uppercase tracking-wide text-primary">Keyingi qadam</span>
          <span className="font-sans text-base font-semibold text-ink">{step.title}</span>
        </div>
      </li>
    );
  }

  return (
    <li className={cn('flex items-center gap-3', step.status === 'locked' && 'opacity-60')}>
      <span
        className={cn(
          'flex min-h-touch min-w-touch items-center justify-center rounded font-mono text-base font-bold',
          step.status === 'done' && 'bg-step-3 text-deep',
          step.status === 'current' && 'bg-step-4 text-deep ring-2 ring-focus ring-offset-2 ring-offset-paper',
          step.status === 'locked' && 'bg-mint text-ink-soft',
        )}
        aria-hidden="true"
      >
        {step.status === 'done' ? <CheckIcon width={18} height={18} /> : step.number}
      </span>
      <div className="flex flex-col">
        <span
          className={cn(
            'font-sans text-base',
            step.status === 'locked' ? 'text-ink-soft' : 'font-medium text-ink',
          )}
        >
          {step.title}
        </span>
        <span className="font-sans text-xs text-ink-soft">{statusLabel(step.status)}</span>
      </div>
    </li>
  );
}

export function TrajectoryLadder({ trajectory }: { trajectory: Trajectory }) {
  const phases = [...new Set(trajectory.steps.map((s) => s.phase))];
  // Bosqichlar chiziqli emas (backend/core/trajectory.py) — "keyingi qadam"
  // raqami bo'yicha eng kichik "locked" bosqich, current_step + 1 emas.
  const nextStepNumber = [...trajectory.steps]
    .filter((s) => s.status === 'locked')
    .sort((a, b) => a.number - b.number)[0]?.number;

  return (
    <div className="flex flex-col gap-6">
      {phases.map((phase) => (
        <section key={phase} aria-label={`Faza ${phase}: ${PHASE_NAMES[phase] ?? ''}`}>
          <h3 className="mb-2 font-display text-base font-semibold text-primary">
            {phase} · {PHASE_NAMES[phase] ?? ''}
          </h3>
          <ol className="flex flex-col gap-3">
            {trajectory.steps
              .filter((s) => s.phase === phase)
              .map((s) => (
                <Rung key={s.number} step={s} isNext={s.number === nextStepNumber} />
              ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
