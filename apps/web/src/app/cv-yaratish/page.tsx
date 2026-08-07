import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Badge } from '@imkon/ui';
import { getMe } from '@/lib/server-api';
import { getMyCv } from '@/lib/ai-api';
import { getMyPortfolio } from '@/lib/passport-api';
import { getMyApplications } from '@/lib/employer-api';
import { getRegions } from '@/lib/regions-api';
import { CvBuilderPanel } from '@/components/cv-builder-panel';
import { AlertIcon, EditIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'CV yaratish',
  description: 'Skills Passport asosida AI yordamida professional CV yarating.',
};

export default async function CvBuilderPage() {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/cv-yaratish');

  const [cv, portfolio, applications, regions] = await Promise.all([
    getMyCv(),
    getMyPortfolio(),
    getMyApplications(),
    getRegions(),
  ]);
  const regionName = regions.find((r) => r.id === me.region_id)?.name;
  const skills = Array.from(new Set(portfolio.flatMap((p) => p.skills)));
  const vacancyOptions = Array.from(
    new Map(applications.map((a) => [a.vacancy_id, a.vacancy_title])).entries(),
  ).map(([id, title]) => ({ id, title }));

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-bright/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 py-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mint text-primary">
            <EditIcon width={20} height={20} />
          </span>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">AI yordamchi</p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-ink">CV yaratish</h1>
              <Badge variant="info">AI qoralama</Badge>
            </div>
          </div>
        </div>
        <p className="mt-4 font-sans text-base text-ink-soft">
          Sertifikatlaringiz va portfolio asosida AI professional CV tuzib beradi — PDF sifatida
          yuklab olishingiz mumkin.
        </p>
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-line bg-mint/40 px-3 py-2.5">
          <AlertIcon width={16} height={16} className="mt-0.5 shrink-0 text-ink-soft" />
          <p className="font-sans text-xs text-ink-soft">
            AI yozgan matnni tekshiring — yolg'on tajriba yoki ko'nikma qo'shilmasin.
          </p>
        </div>
        <div className="mt-6">
          <CvBuilderPanel
            initialCv={cv}
            me={me}
            regionName={regionName}
            skills={skills}
            vacancyOptions={vacancyOptions}
          />
        </div>
      </div>
    </div>
  );
}
