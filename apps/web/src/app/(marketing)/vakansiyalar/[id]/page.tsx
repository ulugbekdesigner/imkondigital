import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, MatchScoreRing, buttonVariants, cn } from '@imkon/ui';
import type { ApplicationOut } from '@/lib/types';
import { getVacancy, getMyApplications } from '@/lib/employer-api';
import { getMyCertificates, getMyPortfolio } from '@/lib/passport-api';
import { getAccessToken } from '@/lib/session';
import { formatThousands } from '@/lib/format';
import { accommodationLabel } from '@/lib/vacancy-accommodations';
import { ApplyForm } from '@/components/apply-form';
import { CheckIcon, ChevronRightIcon, CloseIcon, MicIcon } from '@/components/shell-icons';

const WORK_FORMAT_LABEL: Record<string, string> = {
  remote: '100% Masofaviy',
  hybrid: 'Gibrid',
  office: 'Ofisda',
};

const EMPLOYMENT_LABEL: Record<string, string> = {
  full_time: "To'liq stavka",
  part_time: 'Qisman stavka',
  project: 'Loyihaviy',
};

const APPLICATION_STEPS: { key: string; label: string }[] = [
  { key: 'submitted', label: 'Yuborildi' },
  { key: 'viewed', label: "Ko'rildi" },
  { key: 'interview', label: 'Suhbat' },
  { key: 'decision', label: 'Qaror' },
];

const STATUS_STEP_INDEX: Record<ApplicationOut['status'], number> = {
  submitted: 0,
  viewed: 1,
  interview: 2,
  accepted: 3,
  rejected: 3,
};

function companyInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (!first) return '?';
  const second = parts[1];
  if (!second) return first.slice(0, 2).toUpperCase();
  return (first.charAt(0) + second.charAt(0)).toUpperCase();
}

function accommodationValue(value: unknown): string | null {
  if (typeof value === 'boolean') return null;
  if (Array.isArray(value)) return value.map(String).join(', ');
  if (value === null || value === undefined || value === '') return null;
  return String(value);
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const vacancy = await getVacancy(Number(params.id));
  if (!vacancy) return { title: 'Vakansiya topilmadi' };
  return {
    title: `${vacancy.title} — ${vacancy.company_name}`,
    description: vacancy.description || `${vacancy.title} vakansiyasi IMKON Digital'da.`,
    alternates: { canonical: `/vakansiyalar/${vacancy.id}` },
  };
}

export default async function VacancyDetailPage({ params }: { params: { id: string } }) {
  const vacancyId = Number(params.id);
  const vacancy = await getVacancy(vacancyId);
  if (!vacancy) notFound();

  const authed = Boolean(getAccessToken());
  const [myApplications, myPortfolio, myCertificates] = authed
    ? await Promise.all([getMyApplications(), getMyPortfolio(), getMyCertificates()])
    : [[], [], []];
  const application = myApplications.find((a) => a.vacancy_id === vacancyId) ?? null;
  const alreadyApplied = application !== null;

  const accommodationEntries = Object.entries(vacancy.accommodations).filter(
    ([, value]) => value !== false && value !== null && value !== undefined && value !== '',
  );

  const salaryLabel =
    vacancy.salary_from || vacancy.salary_to
      ? `${vacancy.salary_from ? formatThousands(vacancy.salary_from) : ''}${
          vacancy.salary_to ? `–${formatThousands(vacancy.salary_to)}` : ''
        } so'm`
      : null;

  const currentStepIndex = application ? STATUS_STEP_INDEX[application.status] : -1;

  return (
    <>
      <header className="bg-deep">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <nav
            aria-label="Yo'l xaritasi"
            className="text-mist flex items-center gap-1.5 font-mono text-xs"
          >
            <Link
              href="/"
              className="hover:text-deep-fg focus-visible:ring-focus focus-visible:ring-offset-deep rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              Bosh sahifa
            </Link>
            <ChevronRightIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
            <Link
              href="/vakansiyalar"
              className="hover:text-deep-fg focus-visible:ring-focus focus-visible:ring-offset-deep rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              Vakansiyalar
            </Link>
            <ChevronRightIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="text-deep-fg/70 truncate">{vacancy.title}</span>
          </nav>

          <div className="mt-6 flex items-start gap-4">
            <span
              aria-hidden="true"
              className="bg-deep-fg/10 font-display text-deep-fg flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-bold"
            >
              {companyInitials(vacancy.company_name)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-deep-fg/10 text-mist rounded px-2 py-0.5 font-mono text-xs">
                  Pog'ona {vacancy.ladder_step}
                </span>
                <Badge variant={vacancy.work_format === 'remote' ? 'primary' : 'neutral'}>
                  {WORK_FORMAT_LABEL[vacancy.work_format]}
                </Badge>
                <Badge>{EMPLOYMENT_LABEL[vacancy.employment_type]}</Badge>
                {vacancy.is_inclusive && <Badge variant="primary">Inklyuziv</Badge>}
                {salaryLabel && (
                  <span className="bg-deep-fg/10 text-mist rounded px-2 py-0.5 font-mono text-xs">
                    {salaryLabel}
                  </span>
                )}
              </div>
              <h1 className="font-display text-deep-fg mt-3 text-2xl font-bold">{vacancy.title}</h1>
              <p className="text-md text-mist mt-1 flex items-center gap-1.5 font-sans">
                {vacancy.company_name}
                {vacancy.company_verified && (
                  <span
                    role="img"
                    title="Tasdiqlangan ish beruvchi"
                    aria-label="Tasdiqlangan ish beruvchi"
                    className="bg-primary inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
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
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
          <div className="flex min-w-0 flex-col gap-8">
            {vacancy.description && (
              <div>
                <h2 className="font-display text-ink text-lg font-semibold">Tavsif</h2>
                <p className="text-ink-soft mt-2 whitespace-pre-wrap font-sans text-base">
                  {vacancy.description}
                </p>
              </div>
            )}

            {vacancy.skills_required.length > 0 && (
              <div>
                <h2 className="font-display text-ink text-lg font-semibold">
                  Talab qilinadigan ko'nikmalar
                </h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {vacancy.skills_required.map((s) => (
                    <li key={s}>
                      <Badge>{s}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {accommodationEntries.length > 0 && (
              <div>
                <h2 className="font-display text-ink text-lg font-semibold">
                  Moslashtirilgan sharoitlar
                </h2>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {accommodationEntries.map(([key, value]) => {
                    const desc = accommodationValue(value);
                    return (
                      <li
                        key={key}
                        className="border-line bg-paper flex items-start gap-2.5 rounded-lg border p-4"
                      >
                        <CheckIcon
                          aria-hidden="true"
                          className="text-primary mt-0.5 h-5 w-5 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-ink font-sans text-sm font-semibold">
                            {accommodationLabel(key)}
                          </p>
                          {desc && <p className="text-ink-soft mt-0.5 font-sans text-xs">{desc}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {vacancy.match_score !== null && vacancy.match_score < 100 && (
              <div className="border-line bg-mint rounded-xl border p-4">
                <h2 className="font-display text-ink text-base font-semibold">
                  Moslikni oshirishni xohlaysizmi?
                </h2>
                <p className="text-ink-soft mt-1 font-sans text-sm">
                  Shu pog'onadagi kurslarni tugatib, moslik foizingizni oshiring.
                </p>
                <Link
                  href={`/kurslar?step=${vacancy.ladder_step}`}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-3 gap-1.5')}
                >
                  Mos kurslarni ko'rish
                  <ChevronRightIcon width={14} height={14} aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-5 lg:sticky lg:top-8 lg:self-start">
            {vacancy.match_score !== null && (
              <div className="border-line bg-paper flex items-center gap-4 rounded-xl border p-4">
                <MatchScoreRing value={vacancy.match_score} size={64} />
                <div>
                  <p className="text-ink font-sans text-sm font-semibold">Moslik darajasi</p>
                  <p className="text-ink-soft font-sans text-xs">
                    Ko'nikmalar va hudud asosida hisoblangan
                  </p>
                </div>
              </div>
            )}

            <ApplyForm
              vacancyId={vacancy.id}
              vacancyTitle={vacancy.title}
              companyName={vacancy.company_name}
              authed={authed}
              alreadyApplied={alreadyApplied}
            />

            {authed && !alreadyApplied && (
              <div className="border-line bg-paper flex flex-col gap-2 rounded-xl border p-4">
                <p className="text-ink font-sans text-sm font-semibold">Ariza bilan yuboriladi:</p>
                <div className="text-ink-soft flex items-center justify-between font-sans text-sm">
                  <span>CV (avtomatik)</span>
                  <Link
                    href="/profil#shaxsiy-malumotlar"
                    className="text-primary font-semibold hover:underline"
                  >
                    Ko'rish
                  </Link>
                </div>
                <div className="text-ink-soft flex items-center justify-between font-sans text-sm">
                  <span>Portfolio · {myPortfolio.length} ish</span>
                  <Link
                    href="/profil#yutuqlarim"
                    className="text-primary font-semibold hover:underline"
                  >
                    Tahrirlash
                  </Link>
                </div>
                <div className="text-ink-soft flex items-center justify-between font-sans text-sm">
                  <span>Sertifikatlar · {myCertificates.length}</span>
                  <Link
                    href="/profil#yutuqlarim"
                    className="text-primary font-semibold hover:underline"
                  >
                    Ko'rish
                  </Link>
                </div>
                <p className="text-ink-soft mt-1 flex items-start gap-2 font-sans text-xs">
                  <CheckIcon aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Nogironlik profili — faqat yuqoridagi belgi bilan rozilik bersangiz
                </p>
              </div>
            )}

            <div className="bg-deep relative overflow-hidden rounded-xl p-4">
              <div
                aria-hidden="true"
                className="bg-teal/20 pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl"
              />
              <div className="relative flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="bg-deep-fg/10 text-teal flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                >
                  <MicIcon width={18} height={18} />
                </span>
                <div>
                  <p className="font-display text-deep-fg text-sm font-semibold">
                    Suhbatga tayyorlanamizmi?
                  </p>
                  <p className="text-mist mt-1 font-sans text-xs">
                    ZIYO bilan mashq suhbati o'tkazing — savol-javob va fikr-mulohaza orqali
                    tayyorlaning.
                  </p>
                </div>
              </div>
              <Link
                href="/suhbat-mashqi"
                className="bg-paper text-ink relative mt-3 inline-flex h-9 items-center rounded-full px-4 font-sans text-xs font-semibold hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-deep"
              >
                Suhbat mashqini boshlash
              </Link>
            </div>

            {application && (
              <div className="border-line bg-paper rounded-lg border p-4">
                <p className="text-ink font-sans text-sm font-semibold">Ariza holati</p>
                <ol className="mt-3 flex flex-col">
                  {APPLICATION_STEPS.map((step, i) => {
                    const rejectedHere = application.status === 'rejected' && i === 3;
                    const acceptedHere = application.status === 'accepted' && i === 3;
                    const done = i < currentStepIndex || acceptedHere;
                    const current = i === currentStepIndex && !acceptedHere && !rejectedHere;
                    const upcoming = i > currentStepIndex;
                    const label = rejectedHere
                      ? 'Rad etildi'
                      : acceptedHere
                        ? 'Qabul qilindi'
                        : step.label;

                    return (
                      <li key={step.key} className="flex items-start gap-3 pb-3 last:pb-0">
                        <span
                          className={cn(
                            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                            rejectedHere && 'bg-error text-error-fg',
                            done && !rejectedHere && 'bg-primary text-primary-fg',
                            current && 'border-primary bg-paper text-primary border-2',
                            upcoming && 'border-line bg-paper text-ink-soft border',
                          )}
                        >
                          {rejectedHere ? (
                            <CloseIcon aria-hidden="true" className="h-3.5 w-3.5" />
                          ) : done ? (
                            <CheckIcon aria-hidden="true" className="h-3.5 w-3.5" />
                          ) : (
                            <span className="font-mono text-[0.65rem] font-bold">{i + 1}</span>
                          )}
                        </span>
                        <span
                          className={cn(
                            'font-sans text-sm',
                            upcoming ? 'text-ink-soft' : 'text-ink',
                            (current || rejectedHere || acceptedHere) && 'font-semibold',
                          )}
                        >
                          {label}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
