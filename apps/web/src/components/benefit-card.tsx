import Link from 'next/link';
import { Badge, cn } from '@imkon/ui';
import { formatDate } from '@/lib/format';
import { SaveBenefitButton } from '@/components/save-benefit-button';
import {
  BookIcon,
  BriefcaseIcon,
  BuildingIcon,
  ChartIcon,
  RouteIcon,
  ShieldIcon,
  WalletIcon,
} from '@/components/shell-icons';
import type { BenefitCard as BenefitCardType } from '@/lib/types';

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

/* IMKON Interface.dc.html 4q-blok ("Imtiyozlar") — har kategoriya o'z
   ikonkasi va yumshoq foni bilan ajraladi (rang yagona signal emas,
   ikonka shakli ham farqlanadi). Faqat token-asosli semantik ranglar. */
const CATEGORY_ICON: Record<string, { icon: typeof WalletIcon; className: string }> = {
  moliyaviy: { icon: WalletIcon, className: 'bg-success-bg text-success' },
  soliq: { icon: ChartIcon, className: 'bg-warn-bg text-warn' },
  transport: { icon: RouteIcon, className: 'bg-info-bg text-info' },
  talim: { icon: BookIcon, className: 'bg-bright text-white' },
  bandlik: { icon: BriefcaseIcon, className: 'bg-surface-2 text-ink-soft' },
  tibbiy: { icon: ShieldIcon, className: 'bg-error-bg text-error' },
  boshqa: { icon: BuildingIcon, className: 'bg-surface-2 text-ink-soft' },
};

export function BenefitCard({ benefit, authed }: { benefit: BenefitCardType; authed: boolean }) {
  const { icon: CategoryIcon, className: iconClassName } =
    CATEGORY_ICON[benefit.category] ?? CATEGORY_ICON.boshqa!;

  return (
    <li className="h-full list-none">
      <div
        className="imk-card relative h-full"
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: '14px',
          background: 'var(--land-surface-onlight)',
          color: 'var(--land-text-on-light)',
          border: '1px solid var(--land-line-light)',
          padding: '18px 20px',
        }}
      >
        <Link
          href={`/imtiyozlar/${benefit.id}`}
          className="flex flex-1 items-start gap-3.5 pr-9 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          <span
            aria-hidden="true"
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
              iconClassName,
            )}
          >
            <CategoryIcon width={20} height={20} />
          </span>
          <div className="flex min-w-0 flex-col gap-1.5">
            <h3 className="m-0 text-base font-bold" style={{ color: 'var(--land-text-on-light)' }}>
              {benefit.title}
            </h3>
            <p className="m-0 font-mono text-xs" style={{ color: 'var(--land-text-on-light-dim)' }}>
              {benefit.region_name ?? "Butun O'zbekiston"}
            </p>
            <div className="mt-0.5 flex flex-wrap gap-1.5">
              <Badge variant="neutral">
                {PROVIDER_LABEL[benefit.provider_type] ?? benefit.provider_type}
              </Badge>
              <Badge>{CATEGORY_LABEL[benefit.category] ?? benefit.category}</Badge>
              {benefit.is_relevant_to_me && <Badge variant="primary">Sizga mos</Badge>}
              {benefit.expires_at && (
                <Badge variant="warn">{formatDate(benefit.expires_at)}gacha</Badge>
              )}
            </div>
          </div>
        </Link>
        {authed && (
          <div className="absolute right-3.5 top-3.5">
            <SaveBenefitButton benefitId={benefit.id} initialSaved={benefit.is_saved} iconOnly />
          </div>
        )}
      </div>
    </li>
  );
}
