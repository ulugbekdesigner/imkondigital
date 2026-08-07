import Link from 'next/link';
import { Badge, MatchScoreRing, cn } from '@imkon/ui';
import { formatThousands } from '@/lib/format';
import type { VacancyCard as VacancyCardType } from '@/lib/types';

const STEP_BG = ['bg-step-0', 'bg-step-1', 'bg-step-2', 'bg-step-3', 'bg-step-4'];

const WORK_FORMAT_LABEL: Record<string, string> = {
  remote: '100% Masofaviy',
  hybrid: 'Gibrid',
  office: 'Ofisda',
};

function formatSalary(from: number | null, to: number | null): string | null {
  if (!from && !to) return null;
  const fmt = (n: number) => formatThousands(n);
  if (from && to) return `${fmt(from)}–${fmt(to)} so'm`;
  return `${fmt((from ?? to) as number)} so'mdan`;
}

export function VacancyCard({ vacancy }: { vacancy: VacancyCardType }) {
  const salary = formatSalary(vacancy.salary_from, vacancy.salary_to);

  return (
    <li className="rounded-lg border border-line bg-paper">
      <Link
        href={`/vakansiyalar/${vacancy.id}`}
        className="flex gap-3 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded font-mono text-base font-bold text-deep',
                STEP_BG[vacancy.ladder_step],
              )}
              aria-hidden="true"
            >
              {vacancy.ladder_step}
            </span>
            <Badge variant={vacancy.work_format === 'remote' ? 'primary' : 'neutral'}>
              {WORK_FORMAT_LABEL[vacancy.work_format]}
            </Badge>
            {vacancy.is_inclusive && <Badge variant="primary">Inklyuziv</Badge>}
          </div>
          <h3 className="mt-2 font-display text-base font-semibold text-ink">{vacancy.title}</h3>
          <p className="flex items-center gap-1 font-sans text-base text-ink-soft">
            {vacancy.company_name}
            {vacancy.company_verified && (
              <span
                role="img"
                title="Tasdiqlangan ish beruvchi"
                aria-label="Tasdiqlangan ish beruvchi"
                className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary"
              >
                <svg width="10" height="10" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M4 10.5l3.5 3.5L16 5"
                    className="stroke-primary-fg"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </span>
            )}
          </p>
          <p className="font-mono text-xs text-ink-soft">
            {[salary, vacancy.region_name].filter(Boolean).join(' · ') || 'Hudud belgilanmagan'}
          </p>
        </div>
        {vacancy.match_score !== null && <MatchScoreRing value={vacancy.match_score} />}
      </Link>
    </li>
  );
}
