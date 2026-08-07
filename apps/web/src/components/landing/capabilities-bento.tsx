import Link from 'next/link';
import { formatThousands } from '@/lib/format';
import type { CourseCard, VacancyCard } from '@/lib/types';
import { LandingSection, CursorGlow, LandingCard, Ornament } from './primitives';

const STEP_LABEL = ['Savodxonlik', 'Yordamchi', 'Mutaxassislik', 'IT', 'Tadbirkorlik'];

export function CapabilitiesBento({
  courses,
  vacancies,
  verifiedCompanyCount,
  mentorCount,
}: {
  courses: CourseCard[];
  vacancies: VacancyCard[];
  verifiedCompanyCount: number;
  mentorCount: number;
}) {
  const previewCourses = courses.slice(0, 2);

  return (
    <LandingSection tone="light" ariaLabelledby="land-capabilities-title">
      <CursorGlow tone="light" />
      <Ornament variant="medallion" className="-right-28 top-10" />

      <div className="relative mb-12 flex flex-wrap items-end justify-between gap-10">
        <h2
          id="land-capabilities-title"
          className="max-w-[11em] text-3xl font-bold leading-[1.1] tracking-[-0.03em] md:text-5xl"
          style={{ textWrap: 'balance' }}
        >
          Ishga joylashish uchun kerak bo&apos;lgan{' '}
          <span style={{ color: 'var(--land-brand-500)' }}>hammasi</span>
        </h2>
        <p className="max-w-[24em] text-lg leading-relaxed" style={{ color: 'var(--land-text-on-light-muted)', textWrap: 'pretty' }}>
          Ta&apos;lim, portfolio va vakansiya bitta yo&apos;lga bog&apos;langan — ZIYO esa shu yo&apos;lda yordam beradi.
        </p>
      </div>

      <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <LandingCard label="Ta'lim" title="Moslashadigan kurslar" className="sm:col-span-2 lg:col-span-3">
          Har bir dars subtitr, transkript va to&apos;liq klaviatura boshqaruvi bilan keladi.
          <span className="mt-4 flex flex-col gap-2.5">
            {previewCourses.map((c) => (
              <Link key={c.id} href={`/kurslar/${c.slug}`} className="imk-card__row no-underline">
                <span
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold text-white"
                  style={{ background: 'var(--land-brand-500)' }}
                  aria-hidden="true"
                >
                  {c.ladder_step}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold text-white">{c.title}</span>
                  <span className="block text-xs" style={{ color: 'var(--land-text-on-dark-dim)' }}>
                    {STEP_LABEL[c.ladder_step]} · {c.lessons_count} dars
                  </span>
                </span>
                <span
                  className="rounded-full px-2.5 py-1 font-mono text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.12)', color: 'var(--land-teal-300)' }}
                >
                  {c.is_free ? 'Bepul' : `${formatThousands(c.price)} so'm`}
                </span>
              </Link>
            ))}
            {previewCourses.length === 0 && (
              <span className="text-sm" style={{ color: 'var(--land-text-on-dark-muted)' }}>
                Kurslar tez orada qo&apos;shiladi.
              </span>
            )}
          </span>
        </LandingCard>

        <div
          className="flex flex-col gap-3.5 overflow-hidden rounded-[24px] p-7 text-white sm:col-span-2 lg:col-span-3"
          style={{ background: 'linear-gradient(150deg, var(--navy-900), var(--navy-700))' }}
        >
          <span className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--land-teal-300)' }}>
            Karyera
          </span>
          <h3 className="m-0 text-2xl font-bold tracking-[-0.025em]">Tekshirilgan ish beruvchilar</h3>
          <p className="m-0 max-w-[28em] text-lg leading-relaxed" style={{ color: 'var(--land-text-on-dark-muted)' }}>
            Har kompaniya IMKON tomonidan tasdiqlangandan keyingina vakansiya joylashtira oladi.
          </p>
          <div className="mt-auto grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl p-3.5" style={{ background: 'rgba(255,255,255,0.11)', border: '1px solid rgba(255,255,255,0.18)' }}>
              <div className="text-2xl font-bold text-white">{verifiedCompanyCount}</div>
              <div className="text-xs" style={{ color: 'var(--land-text-on-dark-muted)' }}>tasdiqlangan kompaniya</div>
            </div>
            <div className="rounded-2xl p-3.5" style={{ background: 'rgba(255,255,255,0.11)', border: '1px solid rgba(255,255,255,0.18)' }}>
              <div className="text-2xl font-bold text-white">{vacancies.length}</div>
              <div className="text-xs" style={{ color: 'var(--land-text-on-dark-muted)' }}>ochiq vakansiya</div>
            </div>
          </div>
        </div>

        <LandingCard label="Portfolio" title="Ish namunalari to'plami" className="lg:col-span-2">
          Har bir kursdan keyin tayyor loyiha portfoliongizga qo&apos;shiladi — ish beruvchi ko&apos;radi.
          <span className="mt-auto flex gap-2 pt-3">
            <span className="h-14 flex-1 rounded-xl" style={{ background: 'linear-gradient(140deg, rgba(143,200,230,.4), rgba(143,200,230,.08))' }} aria-hidden="true" />
            <span className="h-14 flex-1 rounded-xl" style={{ background: 'linear-gradient(140deg, var(--land-brand-200), var(--land-brand-100))' }} aria-hidden="true" />
            <span className="h-14 flex-1 rounded-xl" style={{ background: 'linear-gradient(140deg, rgba(255,255,255,.22), rgba(255,255,255,.05))' }} aria-hidden="true" />
          </span>
        </LandingCard>

        <div
          className="flex flex-col gap-3 rounded-[24px] p-6 text-white lg:col-span-2"
          style={{ background: 'var(--land-brand-500)' }}
        >
          <span className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Jamiyat
          </span>
          <h3 className="m-0 text-xl font-bold tracking-[-0.02em]">Mentor va hamjihatlik</h3>
          <p className="m-0 text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.92)' }}>
            Mentorlik so&apos;rang — soha vakili siz bilan yo&apos;l xaritangizni ko&apos;rib chiqadi.
          </p>
          <div className="mt-auto flex items-center gap-2.5">
            <span
              className="rounded-full px-3 py-1.5 font-mono text-sm font-bold text-white"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              {mentorCount} mentor
            </span>
          </div>
        </div>

        <LandingCard label="Qulaylik" title="Interfeys sizga moslashadi" footer={
          <p className="m-0 mt-3 text-sm" style={{ color: 'var(--land-text-on-dark-dim)' }}>
            Yuqoridagi asboblar panelidan darhol yoqiladi — hisob shart emas.
          </p>
        } className="lg:col-span-2">
          Yuqori kontrast, katta shrift va animatsiyani kamaytirish — har sahifada, bir bosishda.
        </LandingCard>
      </div>
    </LandingSection>
  );
}
