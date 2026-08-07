import Link from 'next/link';
import { formatThousands } from '@/lib/format';
import type { DonationProjectOut } from '@/lib/types';
import { LandingSection, CursorGlow, Ornament } from './primitives';

export function DonateSection({ projects }: { projects: DonationProjectOut[] }) {
  const targetTotal = projects.reduce((sum, p) => sum + p.target_amount, 0);
  const collectedTotal = projects.reduce((sum, p) => sum + p.collected_amount, 0);
  const donorsTotal = projects.reduce((sum, p) => sum + p.donors_count, 0);
  const pct = targetTotal > 0 ? Math.min(100, Math.round((collectedTotal / targetTotal) * 100)) : 0;

  if (projects.length === 0) return null;

  return (
    <LandingSection tone="brand" ariaLabelledby="land-donate-title" className="-mb-16 pb-24 pt-20">
      <CursorGlow tone="dark" />
      <Ornament variant="arch-legs" className="top-0" />
      <Ornament variant="arch-crown" className="bottom-0" />

      <div className="relative grid grid-cols-1 gap-12 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <div className="flex flex-col gap-3.5">
          <h2
            id="land-donate-title"
            className="m-0 text-3xl font-bold tracking-[-0.03em] text-white md:text-4xl"
          >
            Bitta xayriya — bitta karyera
          </h2>
          <p className="m-0 max-w-[27em] text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.94)', textWrap: 'pretty' }}>
            {projects.length} ta faol loyiha — kurs, mentor va uskuna uchun. Har bir hissa real
            odamga yetadi.
          </p>
        </div>

        <div className="imk-glass p-6" style={{ background: 'linear-gradient(155deg, rgba(14,23,45,.72), rgba(14,23,45,.6))' }}>
          <div className="mb-3.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{formatSom(collectedTotal)}</span>
            <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
              {formatSom(targetTotal)} dan
            </span>
          </div>
          <div className="imk-progress mb-4">
            <i style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center gap-3.5">
            <Link href="/xayriya" className="imk-btn" style={{ background: 'var(--land-surface-onlight)', color: 'var(--navy-900)' }}>
              Xayriya qilish
            </Link>
            {donorsTotal > 0 && (
              <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                {donorsTotal} nafar homiy
              </span>
            )}
          </div>
        </div>
      </div>
    </LandingSection>
  );
}

function formatSom(n: number): string {
  if (n >= 1_000_000) {
    const millions = Math.round((n / 1_000_000) * 10) / 10;
    const label = Number.isInteger(millions) ? String(millions) : millions.toFixed(1);
    return `${label} mln so'm`;
  }
  return `${formatThousands(n)} so'm`;
}
