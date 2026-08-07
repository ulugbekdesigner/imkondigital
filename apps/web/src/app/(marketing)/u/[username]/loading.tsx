import { LandingSection, CursorGlow } from '@/components/landing/primitives';

/** /u/[username] Skills Passport yuklanayotganda — profil kartasi + ro'yxatlar skeleti. */
export default function PublicPassportLoading() {
  return (
    <LandingSection tone="light" ariaLabelledby="land-passport-loading-title" reveal={false}>
      <CursorGlow tone="light" />
      <div aria-hidden="true" className="relative mx-auto flex max-w-4xl flex-col gap-12">
        <div className="imk-card">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <div className="imk-skeleton" style={{ width: 64, height: 64, borderRadius: 'var(--r-full)' }} />
            <div className="flex flex-1 flex-col gap-2">
              <div className="imk-skeleton" style={{ width: 110, height: 12 }} />
              <div className="imk-skeleton" style={{ width: '50%', height: 26 }} />
              <div className="imk-skeleton" style={{ width: 120, height: 14 }} />
            </div>
          </div>
        </div>

        <section>
          <h2 id="land-passport-loading-title" className="sr-only">
            Skills Passport yuklanmoqda
          </h2>
          <div className="imk-skeleton" style={{ width: 140, height: 22 }} />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="imk-card imk-card--onlight" style={{ height: 90 }} />
            <div className="imk-card imk-card--onlight" style={{ height: 90 }} />
          </div>
        </section>

        <section>
          <div className="imk-skeleton" style={{ width: 120, height: 22 }} />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="imk-card imk-card--onlight" style={{ height: 140 }} />
            <div className="imk-card imk-card--onlight" style={{ height: 140 }} />
            <div className="imk-card imk-card--onlight" style={{ height: 140 }} />
          </div>
        </section>
      </div>
    </LandingSection>
  );
}
