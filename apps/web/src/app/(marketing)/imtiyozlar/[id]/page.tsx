import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@imkon/ui';
import { LandingSection, CursorGlow } from '@/components/landing/primitives';
import { getBenefit } from '@/lib/benefits-api';
import { getAccessToken } from '@/lib/session';
import { SaveBenefitButton } from '@/components/save-benefit-button';
import { formatDate } from '@/lib/format';
import { ArrowLeftIcon, BuildingIcon, ChevronRightIcon, ClipboardIcon, ShieldIcon } from '@/components/shell-icons';

const CATEGORY_LABEL: Record<string, string> = {
  moliyaviy: 'Moliyaviy',
  soliq: 'Soliq',
  transport: 'Transport',
  talim: "Ta'lim",
  bandlik: 'Bandlik',
  tibbiy: 'Tibbiy',
  boshqa: 'Boshqa',
};

const PROVIDER_LABEL: Record<string, string> = {
  davlat: 'Davlat',
  kompaniya: 'Kompaniya',
};

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const benefit = await getBenefit(Number(params.id));
  if (!benefit) return { title: 'Imtiyoz topilmadi' };
  return {
    title: benefit.title,
    description: benefit.description || `${benefit.title} — IMKON Digital Imtiyozlar Markazi.`,
    alternates: { canonical: `/imtiyozlar/${benefit.id}` },
  };
}

export default async function BenefitDetailPage({ params }: { params: { id: string } }) {
  const benefitId = Number(params.id);
  const benefit = await getBenefit(benefitId);
  if (!benefit) notFound();

  const authed = Boolean(getAccessToken());

  return (
    <LandingSection tone="light" ariaLabelledby="imtiyoz-detail-title">
      <CursorGlow tone="light" />
      <div className="relative mx-auto flex max-w-3xl flex-col gap-6">
        <Link
          href="/imtiyozlar"
          className="inline-flex min-h-touch w-fit items-center gap-1.5 rounded font-sans text-base no-underline hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          style={{ color: 'var(--land-text-on-light-dim)' }}
        >
          <ArrowLeftIcon width={18} height={18} aria-hidden="true" />
          Imtiyozlarga qaytish
        </Link>

        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
            style={{ background: 'var(--land-brand-100)', color: 'var(--land-brand-600)' }}
          >
            <ShieldIcon width={22} height={22} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral">{PROVIDER_LABEL[benefit.provider_type] ?? benefit.provider_type}</Badge>
              <Badge>{CATEGORY_LABEL[benefit.category] ?? benefit.category}</Badge>
              {benefit.is_relevant_to_me && <Badge variant="primary">Sizga mos</Badge>}
              {benefit.expires_at && <Badge variant="warn">{formatDate(benefit.expires_at)}gacha</Badge>}
            </div>
            <h1
              id="imtiyoz-detail-title"
              className="mt-2 text-2xl font-bold tracking-[-0.02em]"
              style={{ color: 'var(--land-text-on-light)' }}
            >
              {benefit.title}
            </h1>
            <p
              className="mt-1 flex items-center gap-1.5 font-mono text-sm"
              style={{ color: 'var(--land-text-on-light-dim)' }}
            >
              <BuildingIcon width={14} height={14} aria-hidden="true" />
              {benefit.region_name ?? "Butun O'zbekiston"}
            </p>
          </div>
        </div>

        {benefit.description && (
          <div className="rounded-[20px] border border-line bg-paper p-6 text-ink shadow-glass">
            <h2 className="m-0 font-display text-lg font-bold text-ink">Tavsif</h2>
            <p className="mt-3 whitespace-pre-wrap font-sans text-base text-ink">
              {benefit.description}
            </p>
          </div>
        )}

        {benefit.how_to_apply && (
          <div className="rounded-[20px] border border-line bg-paper p-6 text-ink shadow-glass">
            <h2 className="m-0 flex items-center gap-2 font-display text-lg font-bold text-ink">
              <ClipboardIcon width={18} height={18} aria-hidden="true" />
              Qanday murojaat qilish kerak
            </h2>
            <p className="mt-3 whitespace-pre-wrap font-sans text-base text-ink">
              {benefit.how_to_apply}
            </p>
          </div>
        )}

        {benefit.external_url && (
          <a
            href={benefit.external_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-1 font-sans text-base underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            style={{ color: 'var(--land-brand-600)' }}
          >
            Batafsil havola
            <ChevronRightIcon width={16} height={16} aria-hidden="true" />
          </a>
        )}

        <div>
          {authed ? (
            <SaveBenefitButton benefitId={benefit.id} initialSaved={benefit.is_saved} />
          ) : (
            <p className="font-sans text-base" style={{ color: 'var(--land-text-on-light-muted)' }}>
              Saqlab qo'yish uchun tizimga kiring.
            </p>
          )}
        </div>
      </div>
    </LandingSection>
  );
}
