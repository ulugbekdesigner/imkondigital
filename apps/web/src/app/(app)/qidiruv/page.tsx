import type { Metadata } from 'next';
import { GlassCard } from '@imkon/ui';
import { GlobalSearch } from '@/components/global-search';
import { SearchIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Qidiruv',
  description: "Kurs, vakansiya, material va imtiyozlarni bitta joydan qidiring.",
  robots: { index: false },
};

export default function SearchPage() {
  return (
    <div className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-bright/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 py-10">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint text-primary">
            <SearchIcon />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">Qidiruv</h1>
            <p className="mt-1 font-sans text-base text-ink-soft">
              Kurs, vakansiya, material va imtiyozlarni bitta joydan qidiring.
            </p>
          </div>
        </div>

        <GlassCard className="mt-8 p-5 md:p-6">
          <GlobalSearch />
        </GlassCard>
      </div>
    </div>
  );
}
