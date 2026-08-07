import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicPassport } from '@/lib/passport-api';
import { CertificateCard } from '@/components/certificate-card';
import { PortfolioCard } from '@/components/portfolio-card';
import { LandingSection, CursorGlow } from '@/components/landing/primitives';
import { StarIcon, BookIcon, BriefcaseIcon } from '@/components/shell-icons';
import { formatDate } from '@/lib/format';

const GENEROSITY_LABEL: Record<string, string> = {
  bronze: 'Saxovatli ustoz — Bronza',
  silver: 'Saxovatli ustoz — Kumush',
  gold: 'Saxovatli ustoz — Oltin',
};

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  const passport = await getPublicPassport(params.username);
  if (!passport) return { title: 'Sahifa topilmadi' };
  return {
    title: `${passport.full_name} — Skills Passport`,
    description: `${passport.full_name} ning IMKON Digital'dagi tasdiqlangan ko'nikmalari, sertifikatlari va portfolio'si.`,
    alternates: { canonical: `/u/${passport.username}` },
    robots: passport.visibility === 'public' ? { index: true, follow: true } : { index: false },
  };
}

export default async function PublicPassportPage({
  params,
}: {
  params: { username: string };
}) {
  const passport = await getPublicPassport(params.username);
  if (!passport) notFound();

  const initials = passport.full_name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  // Faqat haqiqiy, allaqachon yuklangan ma'lumotdan — soxta "N ko'nikma
  // tasdiqlangan" da'vosi ATAYLAB yo'q (hech qanday backend maydoni buni
  // hisoblamaydi, KENGAYISH_PLAN_3.md 4m-bosqichida ham shu xulosaga kelingan).
  const skillChips = Array.from(new Set(passport.portfolio.flatMap((p) => p.skills))).slice(0, 8);
  const confirmedCertCount = passport.certificates.filter((c) => c.confirmed_at !== null).length;
  const summaryParts = [
    `${passport.certificates.length} sertifikat`,
    `${passport.portfolio.length} portfolio ishi`,
  ];
  if (confirmedCertCount > 0) {
    summaryParts.push(`${confirmedCertCount} tasi mentor tomonidan tasdiqlangan`);
  }

  return (
    <LandingSection tone="light" ariaLabelledby="land-passport-title">
      <CursorGlow tone="light" />
      <div className="relative mx-auto flex max-w-4xl flex-col gap-12">
        <div className="imk-card">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <span
              aria-hidden="true"
              className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
              style={{ background: 'linear-gradient(140deg, var(--land-teal-400), var(--land-brand-500))' }}
            >
              {initials || '—'}
            </span>
            <div className="flex flex-col gap-2">
              <span className="imk-card__label">Skills Passport</span>
              <h1 id="land-passport-title" className="m-0 text-2xl font-bold text-white">
                {passport.full_name}
              </h1>
              <p className="m-0 font-mono text-sm" style={{ color: 'var(--land-text-on-dark-dim)' }}>
                @{passport.username}
              </p>
              {passport.generosity_tier && (
                <span className="imk-chip imk-chip--active w-fit inline-flex items-center gap-1.5">
                  <StarIcon width={13} height={13} />
                  {GENEROSITY_LABEL[passport.generosity_tier]}
                </span>
              )}
              <p className="m-0 text-sm" style={{ color: 'var(--land-text-on-dark-muted)' }}>
                {passport.region_name && `${passport.region_name} · `}
                IMKON Digital'da {formatDate(passport.member_since)} dan
                buyon
              </p>
            </div>
          </div>

          {skillChips.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {skillChips.map((skill) => (
                <li key={skill} className="imk-chip">
                  {skill}
                </li>
              ))}
            </ul>
          )}

          <p className="m-0 mt-4 text-sm leading-relaxed" style={{ color: 'var(--land-text-on-dark-muted)' }}>
            {summaryParts.join(' · ')}
          </p>

          {passport.portfolio.length > 0 && (
            <a
              href="#portfolio-title"
              className="imk-chip imk-chip--active mt-5 inline-flex min-h-touch w-fit items-center"
            >
              Portfoliosini ko'rish
            </a>
          )}
        </div>

        <section aria-labelledby="certs-title">
          <h2 id="certs-title" className="text-xl font-bold" style={{ color: 'var(--land-text-on-light)' }}>
            Sertifikatlar
          </h2>
          {passport.certificates.length > 0 ? (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {passport.certificates.map((c) => (
                <CertificateCard key={c.uid} cert={c} tone="onlight" />
              ))}
            </ul>
          ) : (
            <div className="imk-empty mt-4">
              <span className="imk-empty__icon" aria-hidden="true">
                <BookIcon width={24} height={24} />
              </span>
              <div>
                <h3 className="m-0 text-base font-bold">Hali sertifikat yo'q</h3>
                <p className="m-0 mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                  Kurslarni tugatgach, sertifikatlar shu yerda ko'rinadi.
                </p>
              </div>
            </div>
          )}
        </section>

        <section aria-labelledby="portfolio-title">
          <h2 id="portfolio-title" className="text-xl font-bold" style={{ color: 'var(--land-text-on-light)' }}>
            Portfolio
          </h2>
          {passport.portfolio.length > 0 ? (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {passport.portfolio.map((p) => (
                <PortfolioCard key={p.id} item={p} tone="onlight" />
              ))}
            </ul>
          ) : (
            <div className="imk-empty mt-4">
              <span className="imk-empty__icon" aria-hidden="true">
                <BriefcaseIcon width={24} height={24} />
              </span>
              <div>
                <h3 className="m-0 text-base font-bold">Hali portfolio elementi yo'q</h3>
                <p className="m-0 mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                  Bajarilgan ishlar qo'shilgach, portfolio shu yerda ko'rinadi.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </LandingSection>
  );
}
