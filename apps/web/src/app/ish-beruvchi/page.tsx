import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Badge, buttonVariants } from '@imkon/ui';
import { getMe } from '@/lib/server-api';
import { getCompanyStats, getMyCompanies, getMyVacancies } from '@/lib/employer-api';
import { CreateCompanyForm } from '@/components/create-company-form';
import { CabinetPageHeader } from '@/components/cabinet-shell';
import { AlertIcon, BriefcaseIcon, CheckIcon, ClipboardIcon, PlusIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Ish beruvchi kabineti',
  robots: { index: false },
};

const STATUS_META: Record<string, { label: string; variant: 'primary' | 'info' | 'neutral' }> = {
  draft: { label: 'Qoralama', variant: 'info' },
  published: { label: 'Chop etilgan', variant: 'primary' },
  closed: { label: 'Yopilgan', variant: 'neutral' },
};

export default async function EmployerDashboardPage() {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/ish-beruvchi');

  const isEmployer = me.roles.includes('employer') || me.roles.includes('admin');
  const companies = isEmployer ? await getMyCompanies() : [];
  const company = companies[0];

  if (!company) {
    return (
      <div className="max-w-2xl">
        <CabinetPageHeader
          title="Ish beruvchi kabineti"
          subtitle="Kompaniyangizni ro'yxatdan o'tkazing va bir daqiqada birinchi vakansiyani joylashtiring."
        />
        <CreateCompanyForm />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <CabinetPageHeader
        title={
          <>
            {company.name}
            {company.verified ? (
              <Badge variant="success">
                <CheckIcon width={12} height={12} aria-hidden="true" />
                Tasdiqlangan
              </Badge>
            ) : (
              <Badge variant="warn">
                <AlertIcon width={12} height={12} aria-hidden="true" />
                Tekshirilmoqda
              </Badge>
            )}
          </>
        }
        subtitle={
          <>
            {company.quota_recommended !== null && company.quota_recommended > 0
              ? `Tavsiya etilgan inklyuziv kvota: ${company.quota_recommended} nafar`
              : 'Vakansiyalaringiz shu yerda boshqariladi'}
            {!company.verified && ' · Kompaniya moderatsiya tomonidan tekshirilmoqda, odatda 1-2 ish kuni.'}
          </>
        }
        action={
          <Link href="/ish-beruvchi/vakansiyalar/yangi" className={buttonVariants({ variant: 'primary' })}>
            <PlusIcon width={18} height={18} aria-hidden="true" />
            Yangi vakansiya
          </Link>
        }
      />

      <VacanciesSection companyId={company.id} />
    </div>
  );
}

async function VacanciesSection({ companyId }: { companyId: number }) {
  const [vacancies, stats] = await Promise.all([
    getMyVacancies(companyId),
    getCompanyStats(companyId),
  ]);

  const kpis = stats
    ? [
        { label: 'Faol vakansiya', value: stats.active_vacancies },
        { label: 'Yangi ariza', value: stats.new_applications },
        { label: 'Ishga olindi', value: stats.hired },
      ]
    : null;

  return (
    <section>
      {kpis ? (
        <div className="grid grid-cols-3 gap-3">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="rounded-card border border-line bg-paper p-4">
              <p className="font-sans text-xs font-bold uppercase tracking-wide text-ink-soft">
                {kpi.label}
              </p>
              <p className="mt-1 font-mono text-xl font-bold tabular-nums text-ink">{kpi.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <div role="alert" className="imk-error">
          <span className="imk-error__icon" aria-hidden="true">
            <AlertIcon width={22} height={22} />
          </span>
          <div>
            <p className="font-sans text-base font-semibold text-ink">Ko'rsatkichlarni yuklab bo'lmadi.</p>
            <Link
              href="/ish-beruvchi"
              className="font-sans text-sm text-primary underline-offset-4 hover:underline"
            >
              Qayta urinish
            </Link>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-ink">Vakansiyalar</h2>

        {vacancies.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-2">
            {vacancies.map((v) => {
              const meta = STATUS_META[v.status] ?? { label: v.status, variant: 'neutral' as const };
              return (
                <li key={v.id}>
                  <Link
                    href={`/ish-beruvchi/vakansiyalar/${v.id}`}
                    className="flex min-h-touch items-center justify-between gap-3 rounded-lg border border-line bg-paper px-4 py-3 hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <ClipboardIcon width={18} height={18} className="shrink-0 text-ink-soft" aria-hidden="true" />
                      <span className="truncate font-sans text-base text-ink">{v.title}</span>
                    </span>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="imk-empty mt-3">
            <span className="imk-empty__icon" aria-hidden="true">
              <BriefcaseIcon width={26} height={26} />
            </span>
            <p className="font-sans text-base font-medium text-ink">Hali vakansiya yo'q</p>
            <p className="max-w-sm font-sans text-sm text-ink-soft">
              Birinchi vakansiyangizni joylashtiring — nomzodlar shu kabinetda ko'rina boshlaydi.
            </p>
            <Link href="/ish-beruvchi/vakansiyalar/yangi" className={buttonVariants({ size: 'sm' })}>
              Yangi vakansiya
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
