import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, GlassCard, MatchScoreRing, buttonVariants } from '@imkon/ui';
import { getExternalJob } from '@/lib/external-jobs-api';
import { BuildingIcon, ChevronRightIcon, SparkIcon } from '@/components/shell-icons';

const SOURCE_LABEL: Record<string, string> = {
  remoteok: 'Remote OK',
  remotive: 'Remotive',
  weworkremotely: 'We Work Remotely',
};

const LADDER_LABEL: Record<number, string> = {
  0: 'Savodxonlik',
  1: 'Yordamchi',
  2: 'Mutaxassislik',
  3: 'IT',
  4: 'Tadbirkorlik',
};

/** posted_at real maydonidan sof taqdimot uchun nisbiy vaqt — biznes-mantiq emas. */
function formatPostedAt(iso: string | null): string | null {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'Bugun joylandi';
  if (days === 1) return 'Kecha joylandi';
  if (days < 30) return `${days} kun oldin joylandi`;
  return `${Math.floor(days / 30)} oy oldin joylandi`;
}

/** Manba nomidan qisqa harf-belgi (masalan "Remote OK" → "RO") — kompaniya logotipi
 * o'rniga, chunki agregatorlar kompaniya rasmini bermaydi. */
function sourceInitials(label: string): string {
  const letters = label
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase());
  return (letters.join('') || '?').slice(0, 3);
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const job = await getExternalJob(Number(params.id));
  if (!job) return { title: 'Ish e\'loni topilmadi' };
  return {
    title: job.title_uz || job.title,
    description: `${job.company_name} — ${SOURCE_LABEL[job.source] ?? job.source} orqali.`,
  };
}

export default async function ExternalJobDetailPage({ params }: { params: { id: string } }) {
  const job = await getExternalJob(Number(params.id));
  if (!job) notFound();

  const postedLabel = formatPostedAt(job.posted_at);

  return (
    <>
      <header className="bg-deep">
        <div className="mx-auto max-w-2xl px-4 py-10">
          <nav
            aria-label="Yo'l xaritasi"
            className="flex items-center gap-1.5 font-mono text-xs text-mist"
          >
            <Link
              href="/"
              className="rounded-sm hover:text-deep-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-deep"
            >
              Bosh sahifa
            </Link>
            <ChevronRightIcon width={12} height={12} className="shrink-0" aria-hidden="true" />
            <Link
              href="/xalqaro-ishlar"
              className="rounded-sm hover:text-deep-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-deep"
            >
              Xalqaro ishlar
            </Link>
            <ChevronRightIcon width={12} height={12} className="shrink-0" aria-hidden="true" />
            <span className="truncate text-deep-fg/70">{job.title_uz || job.title}</span>
          </nav>

          <div className="mt-6 flex items-start gap-4">
            <span
              aria-hidden="true"
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-deep-fg/10 font-display text-lg font-bold text-deep-fg"
            >
              {sourceInitials(SOURCE_LABEL[job.source] ?? job.source)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="neutral">{SOURCE_LABEL[job.source] ?? job.source}</Badge>
                {job.ladder_step !== null && (
                  <Badge variant="neutral">{LADDER_LABEL[job.ladder_step] ?? job.ladder_step}</Badge>
                )}
                {job.location_note && <Badge variant="neutral">{job.location_note}</Badge>}
              </div>
              <h1 className="mt-3 font-display text-2xl font-bold text-deep-fg">
                {job.title_uz || job.title}
              </h1>
              {job.title_uz && (
                <p className="mt-1 font-sans text-sm text-mist">Asl sarlavha: {job.title}</p>
              )}
              <p className="mt-2 flex items-center gap-1.5 font-sans text-base text-mist">
                <BuildingIcon width={16} height={16} aria-hidden="true" className="shrink-0" />
                {job.company_name}
              </p>
              {postedLabel && <p className="mt-1 font-mono text-xs text-mist">{postedLabel}</p>}
            </div>
            {job.match_score !== null && (
              <MatchScoreRing value={job.match_score} size={56} surface="deep" />
            )}
          </div>

          {job.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {job.tags.slice(0, 6).map((tag) => (
                <Badge key={tag} variant="neutral">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
          <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-teal/15 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-2xl px-4 py-10">
          <GlassCard className="p-6">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
              <SparkIcon width={16} height={16} aria-hidden="true" className="text-bright" />
              Tavsif (o'zbekcha, AI tarjima)
            </h2>
            <p className="mt-2 whitespace-pre-wrap font-sans text-base text-ink">
              {job.description_uz || 'Tarjima hali tayyor emas — pastda asl matnni ko\'ring.'}
            </p>
          </GlassCard>

          <details className="mt-4 rounded-lg border border-line p-4">
            <summary className="cursor-pointer font-sans text-sm font-medium text-ink">
              Asl matn (ingliz tilida)
            </summary>
            <p className="mt-3 whitespace-pre-wrap font-sans text-sm text-ink-soft">
              {job.description}
            </p>
          </details>

          <div className="mt-8 rounded-xl border border-line bg-mint/40 p-5">
            <p className="font-sans text-sm text-ink-soft">
              Bu e'lon {SOURCE_LABEL[job.source] ?? job.source} orqali topildi. IMKON Digital
              vositachi emas — arizani asl manbada topshirasiz.
            </p>
            <a
              href={job.source_url}
              target="_blank"
              rel="noreferrer noopener"
              className={`${buttonVariants()} mt-3`}
            >
              Asl manbada ochish
              <ChevronRightIcon width={16} height={16} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
