import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buttonVariants } from '@imkon/ui';
import { PageHeader } from '@/components/page-header';
import { VacancyCard } from '@/components/vacancy-card';
import { EmptyState } from '@/components/state-panels';
import { getRegionDetail } from '@/lib/regions-api';
import { formatThousands } from '@/lib/format';
import { ArrowLeftIcon, BriefcaseIcon, CheckIcon, ChevronRightIcon, ShieldIcon, UsersIcon } from '@/components/shell-icons';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const region = await getRegionDetail(params.slug);
  if (!region) return { title: 'Hudud topilmadi' };
  return {
    title: region.name,
    description: `${region.name} — ochiq vakansiyalar, imtiyozlar va IMKON Digital foydalanuvchilari statistikasi.`,
    alternates: { canonical: `/hududlar/${region.slug}` },
  };
}

export default async function RegionDetailPage({ params }: { params: { slug: string } }) {
  const region = await getRegionDetail(params.slug);
  if (!region) notFound();

  const stats = [
    { label: "O'quvchi", value: formatThousands(region.stats.registered_users), Icon: UsersIcon },
    { label: 'Ishga joylashgan', value: formatThousands(region.stats.placed_count), Icon: CheckIcon },
    { label: 'Ochiq vakansiya', value: formatThousands(region.stats.open_vacancies), Icon: BriefcaseIcon },
    { label: 'Imtiyozlar', value: formatThousands(region.stats.published_benefits), Icon: ShieldIcon },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Hudud"
        title={region.name}
        lead={`${formatThousands(region.stats.registered_users)} o'quvchi, ${formatThousands(region.stats.placed_count)} kishi ishga joylashgan, ${formatThousands(region.stats.open_vacancies)} ta ochiq vakansiya va ${formatThousands(region.stats.published_benefits)} ta imtiyoz.`}
      />

      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
          <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-bright/15 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-12">
          <nav aria-label="Yo'l" className="flex items-center gap-1.5 font-mono text-xs text-ink-soft">
            <Link
              href="/hududlar"
              className="rounded hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            >
              Hududlar
            </Link>
            <ChevronRightIcon width={14} height={14} aria-hidden="true" />
            <span aria-current="page" className="text-ink">
              {region.name}
            </span>
          </nav>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => {
              const Icon = s.Icon;
              return (
                <div key={s.label} className="rounded-xl border border-line bg-paper p-5">
                  <dt className="flex items-center gap-2 font-sans text-sm text-ink-soft">
                    <Icon width={16} height={16} aria-hidden="true" className="text-bright" />
                    {s.label}
                  </dt>
                  <dd className="mt-1 font-mono text-2xl font-bold text-ink">{s.value}</dd>
                </div>
              );
            })}
          </dl>

          <div className="mt-10 flex items-center justify-between gap-4">
            <h2 className="font-display text-lg font-semibold text-ink">
              {region.name}dagi vakansiyalar
            </h2>
            <Link
              href={`/vakansiyalar?region_id=${region.id}`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Barchasini ko'rish
            </Link>
          </div>

          {region.vacancies_preview.length > 0 ? (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {region.vacancies_preview.map((v) => (
                <VacancyCard key={v.id} vacancy={v} />
              ))}
            </ul>
          ) : (
            <div className="mt-6">
              <EmptyState
                icon={<BriefcaseIcon width={24} height={24} aria-hidden="true" />}
                title="Hozircha bu hududda vakansiya yo'q"
                description="Ish beruvchimisiz? Birinchi vakansiyangizni shu hudud uchun joylashtiring."
                action={
                  <Link href="/ish-beruvchi" className={buttonVariants({ size: 'sm' })}>
                    Vakansiya joylashtirish
                  </Link>
                }
              />
            </div>
          )}

          <div className="mt-8">
            <Link
              href="/hududlar"
              className="inline-flex min-h-touch items-center gap-1.5 rounded font-sans text-base text-ink-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            >
              <ArrowLeftIcon width={18} height={18} />
              Barcha hududlar
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
