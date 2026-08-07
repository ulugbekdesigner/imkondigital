import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonVariants, cn } from '@imkon/ui';
import { PageHeader } from '@/components/page-header';
import { WorkFormatFilter } from '@/components/work-format-filter';
import { RegionFilter } from '@/components/region-filter';
import { VacancyStepFilter } from '@/components/vacancy-step-filter';
import { SalaryFilter } from '@/components/salary-filter';
import { VacancyCard } from '@/components/vacancy-card';
import { BuildingIcon, RouteIcon, SlidersIcon } from '@/components/shell-icons';
import { getVacancyCatalog } from '@/lib/employer-api';
import { getRegions } from '@/lib/regions-api';

export const metadata: Metadata = {
  title: 'Vakansiyalar',
  description:
    'Masofaviy va inklyuziv vakansiyalar — Skills Passport asosida sizga mos ish takliflari.',
  alternates: { canonical: '/vakansiyalar' },
};

export default async function VacanciesPage({
  searchParams,
}: {
  searchParams: { format?: string; region_id?: string; step?: string; min_salary?: string };
}) {
  const workFormat = searchParams.format;
  const regionId = searchParams.region_id;
  const step = searchParams.step;
  const minSalary = searchParams.min_salary;
  const hasActiveFilter =
    workFormat !== undefined ||
    regionId !== undefined ||
    step !== undefined ||
    minSalary !== undefined;
  const [{ items }, regions] = await Promise.all([
    getVacancyCatalog({
      workFormat,
      regionId: regionId ? Number(regionId) : undefined,
      step: step ? Number(step) : undefined,
      minSalary: minSalary ? Number(minSalary) : undefined,
    }),
    getRegions(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Bandlik portali"
        title="Sizga mos vakansiyalar"
        lead="Tizim ko'nikmalaringiz, hududingiz va ish formatingizga qarab moslik foizini ko'rsatadi. Kirsangiz — har vakansiya yonida shaxsiy moslik darajasi chiqadi."
      />

      <div className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
          <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-bright/15 blur-3xl" />
        </div>

        <section className="relative mx-auto max-w-6xl px-4 pt-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-deep flex flex-col gap-3 rounded-xl px-6 py-6">
              <BuildingIcon className="text-bright" />
              <div>
                <h2 className="font-display text-deep-fg text-base font-semibold">Kompaniyasiz?</h2>
                <p className="text-mist mt-1 font-sans text-base">
                  Bir daqiqada ro'yxatdan o'ting va birinchi vakansiyangizni hoziroq joylashtiring.
                </p>
              </div>
              <Link
                href="/ish-beruvchi"
                className={cn(buttonVariants({ variant: 'secondary' }), 'self-start')}
              >
                Kompaniya sifatida qo'shilish
              </Link>
            </div>

            <div className="border-line bg-paper flex flex-col gap-3 rounded-xl border px-6 py-6">
              <RouteIcon className="text-primary" />
              <div>
                <h2 className="font-display text-ink text-base font-semibold">
                  Dunyo bo'ylab masofaviy ish qidiryapsizmi?
                </h2>
                <p className="text-ink-soft mt-1 font-sans text-base">
                  Remote OK, Remotive va We Work Remotely'dan o'zbekcha tarjima bilan.
                </p>
              </div>
              <Link
                href="/xalqaro-ishlar"
                className={cn(buttonVariants({ variant: 'outline' }), 'self-start')}
              >
                Xalqaro ishlarni ko'rish
              </Link>
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-6xl px-4 py-12">
          <div className="border-line bg-mint/40 rounded-xl border p-5">
            <div className="flex items-center gap-2">
              <SlidersIcon className="text-bright" />
              <span className="text-bright font-mono text-xs uppercase tracking-widest">Filtr</span>
            </div>

            <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-6">
                <div className="flex flex-col gap-2">
                  <span className="text-ink-soft font-sans text-sm font-medium">Ish formati</span>
                  <WorkFormatFilter
                    active={workFormat}
                    regionId={regionId}
                    step={step}
                    minSalary={minSalary}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-ink-soft font-sans text-sm font-medium">Pog'ona</span>
                  <VacancyStepFilter
                    active={step !== undefined ? Number(step) : undefined}
                    format={workFormat}
                    regionId={regionId}
                    minSalary={minSalary}
                  />
                </div>
                <RegionFilter
                  regions={regions}
                  active={regionId}
                  format={workFormat}
                  step={step}
                  minSalary={minSalary}
                />
                <SalaryFilter active={minSalary} format={workFormat} regionId={regionId} step={step} />
              </div>

              {hasActiveFilter && (
                <Link
                  href="/vakansiyalar"
                  className="min-h-touch border-line text-ink hover:bg-mint focus-visible:ring-focus inline-flex items-center self-start rounded-full border px-4 font-sans text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  Filtrlarni tozalash
                </Link>
              )}
            </div>
          </div>

          {items.length > 0 ? (
            <>
              <p className="text-ink-soft mt-6 font-mono text-xs">
                {items.length} ta vakansiya ko'rsatilmoqda
              </p>
              <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((v) => (
                  <VacancyCard key={v.id} vacancy={v} />
                ))}
              </ul>
            </>
          ) : (
            <div className="border-line bg-mint/40 mt-8 rounded-xl border border-dashed p-8 text-center">
              <h2 className="font-display text-ink text-lg font-bold">
                {hasActiveFilter
                  ? "Bu filtr bo'yicha vakansiya topilmadi"
                  : "Hozircha bu bo'yicha vakansiya yo'q"}
              </h2>
              <p className="text-ink-soft mx-auto mt-2 max-w-xl font-sans text-base">
                {hasActiveFilter
                  ? "Filtrni o'zgartirib ko'ring yoki Ziyo'dan mos vakansiya so'rang."
                  : "Ro'yxatdan o'ting — yangi vakansiya chiqishi bilan xabar beramiz. Ish beruvchimisiz? Birinchi vakansiyangizni joylashtiring."}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {hasActiveFilter ? (
                  <>
                    <Link href="/karyera-kochi" className={buttonVariants({ variant: 'outline' })}>
                      Ziyo'dan so'rash
                    </Link>
                    <Link href="/vakansiyalar" className={buttonVariants()}>
                      Filtrlarni tozalash
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/ish-beruvchi" className={buttonVariants({ variant: 'outline' })}>
                      Vakansiya joylashtirish
                    </Link>
                    <Link href="/royxatdan-otish" className={buttonVariants()}>
                      Ro'yxatdan o'tish
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
