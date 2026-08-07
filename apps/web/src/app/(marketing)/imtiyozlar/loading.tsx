import { LandingSection, CursorGlow } from '@/components/landing/primitives';

/** /imtiyozlar yuklanish holati — docs/design/README.md majburiy holat qoidasi. Sarlavha
 * + provayder filtri + karta ro'yxati shaklini takrorlaydi (ichki natijalar
 * o'zining Suspense/BenefitsSkeleton chegarasiga ega — bu segment darajasidagi
 * BIRINCHI yuklanish uchun, masalan sahifaga to'g'ridan-to'g'ri kirilganda). */
export default function ImtiyozlarLoading() {
  return (
    <LandingSection tone="light" ariaLabelledby="land-imtiyozlar-loading-title" reveal={false}>
      <CursorGlow tone="light" />
      <div className="relative mx-auto max-w-6xl">
        <div aria-hidden="true" className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex max-w-2xl flex-col gap-3">
            <div className="imk-skeleton" style={{ width: 160, height: 12 }} />
            <h2 id="land-imtiyozlar-loading-title" className="sr-only">
              Imtiyozlar yuklanmoqda
            </h2>
            <div className="imk-skeleton" style={{ width: 280, height: 34 }} />
            <div className="imk-skeleton" style={{ width: 340, height: 16 }} />
          </div>
        </div>

        <div aria-hidden="true" className="mt-8 flex flex-wrap gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="imk-skeleton"
              style={{ width: 96, height: 44, borderRadius: 'var(--r-full)' }}
            />
          ))}
        </div>

        <div aria-hidden="true" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="imk-card"
              style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: '18px 20px' }}
            >
              <div
                className="imk-skeleton"
                style={{ width: 44, height: 44, borderRadius: 'var(--r-lg)', flexShrink: 0 }}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="imk-skeleton" style={{ width: '80%', height: 16 }} />
                <div className="imk-skeleton" style={{ width: '40%', height: 12 }} />
                <div className="imk-skeleton mt-1" style={{ width: '33%', height: 20 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </LandingSection>
  );
}
