import Link from 'next/link';
import { buttonVariants, cn, MatchScoreRing } from '@imkon/ui';
import { BriefcaseIcon, ChevronRightIcon } from '@/components/shell-icons';
import type { VacancyCard } from '@/lib/types';

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function salaryLine(v: VacancyCard): string {
  if (v.salary_from && v.salary_to) return `${(v.salary_from / 1e6).toFixed(0)}–${(v.salary_to / 1e6).toFixed(0)} mln so'm`;
  if (v.salary_from) return `${(v.salary_from / 1e6).toFixed(0)} mln so'mdan`;
  return "Kelishilgan holda";
}

const WORK_FORMAT_LABEL: Record<string, string> = {
  remote: 'Masofadan',
  office: 'Ofisda',
  hybrid: 'Aralash',
};

export function MatchedVacanciesCard({ vacancies }: { vacancies: VacancyCard[] }) {
  return (
    <div className="flex flex-1 flex-col gap-3.5 rounded-xl border border-line bg-paper p-[22px]">
      <div className="flex items-center justify-between">
        <span className="font-display text-md font-bold text-ink">Sizga mos vakansiyalar</span>
        <Link href="/vakansiyalar" className="inline-flex items-center gap-0.5 font-sans text-sm font-semibold text-primary underline-offset-4 hover:underline">
          Barchasi
          <ChevronRightIcon width={14} height={14} aria-hidden="true" />
        </Link>
      </div>
      {vacancies.length === 0 ? (
        <div className="imk-empty">
          <span aria-hidden="true" className="imk-empty__icon">
            <BriefcaseIcon width={20} height={20} />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-sans text-sm font-bold text-ink">Hozircha mos vakansiya yo&apos;q</p>
            <p className="font-sans text-sm text-ink-soft">
              Profilingizni to&apos;ldirsangiz, tavsiyalar aniqroq bo&apos;ladi.
            </p>
          </div>
          <Link href="/profil" className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}>
            Profilni to&apos;ldirish
          </Link>
        </div>
      ) : (
        vacancies.map((v) => (
          <div key={v.id} className="flex min-w-0 flex-col gap-3 rounded-2xl border border-line p-3.5 sm:flex-row sm:items-center sm:gap-3.5">
            <div className="flex min-w-0 flex-1 items-center gap-3.5">
              <div
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink font-sans text-md font-bold text-paper"
              >
                {initialOf(v.company_name)}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-sans text-base font-bold text-ink">{v.title}</span>
                <span className="truncate font-sans text-sm text-ink-soft">
                  {v.company_name} · {WORK_FORMAT_LABEL[v.work_format] ?? v.work_format} · {salaryLine(v)}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
              {v.match_score !== null && <MatchScoreRing value={v.match_score} size={52} />}
              <Link href={`/vakansiyalar/${v.id}`} className={buttonVariants({ size: 'sm' })}>
                Ariza
              </Link>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
