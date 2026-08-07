import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProgressBar } from '@imkon/ui';
import { LandingSection, CursorGlow, Ornament } from '@/components/landing/primitives';
import { CheckIcon, ShieldIcon, UsersIcon } from '@/components/shell-icons';
import { DonateForm } from '@/components/donate-form';
import { getDonationProject } from '@/lib/donation-api';
import { formatDate, formatThousands } from '@/lib/format';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const project = await getDonationProject(Number(params.id));
  return { title: project?.title ?? 'Xayriya loyihasi' };
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Faol',
  funded: 'Moliyalashtirildi',
  completed: 'Yakunlandi',
};

export default async function DonationProjectDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { thanks?: string };
}) {
  const project = await getDonationProject(Number(params.id));
  if (!project || project.status === 'draft') notFound();

  const showThanks = searchParams.thanks === '1';

  return (
    <LandingSection tone="brand" ariaLabelledby="xayriya-detail-title">
      <CursorGlow tone="dark" />
      <Ornament variant="arch-legs" className="top-0" />
      <Ornament variant="arch-crown" className="bottom-0" />

      <div className="relative mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex flex-col gap-3">
          <span
            className="text-xs font-bold uppercase tracking-[0.14em]"
            style={{ color: 'var(--land-teal-200)' }}
          >
            Ochiq Xayriya
          </span>
          <h1
            id="xayriya-detail-title"
            className="m-0 text-3xl font-bold tracking-[-0.03em] text-white md:text-4xl"
          >
            {project.title}
          </h1>
          <p className="m-0 max-w-xl text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.92)' }}>
            {project.story}
          </p>
        </div>

        {showThanks && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border-l-4 border-gold bg-mint p-5 shadow-glow-gold"
          >
            <CheckIcon
              width={22}
              height={22}
              aria-hidden="true"
              className="text-gold-fg"
              style={{ flexShrink: 0, marginTop: 2 }}
            />
            <div>
              <h2 className="m-0 font-display text-lg font-bold text-ink">Rahmat!</h2>
              <p className="mt-2 font-sans text-base text-ink">
                Hissangiz qabul qilinmoqda — bir necha soniyada balansga qo&apos;shiladi. Email
                qoldirgan bo&apos;lsangiz, loyiha yakunida natija xatini olasiz.
              </p>
            </div>
          </div>
        )}

        <div className="rounded-[20px] border border-line bg-paper p-6 text-ink shadow-glass">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-bold tabular-nums text-ink">
              {formatThousands(project.collected_amount)}
            </span>
            <span className="font-sans text-sm text-ink-soft">
              {formatThousands(project.target_amount)} so&apos;mdan · {project.progress_pct}%
            </span>
          </div>
          <div className="mt-3">
            <ProgressBar
              value={project.progress_pct}
              label={`${project.title} — ${project.progress_pct}% yig'ildi`}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <span
              className={`imk-chip imk-chip--onlight ${project.status === 'active' ? 'imk-chip--active' : ''}`}
            >
              {STATUS_LABEL[project.status] ?? project.status}
            </span>
            <span className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-ink-soft">
              <UsersIcon width={15} height={15} aria-hidden="true" />
              {project.donors_count} homiy qatnashdi
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-sans text-xs text-ink-soft">
            {project.deadline && <span>Muddat: {formatDate(project.deadline)}</span>}
            <span>Donor: {project.owner_name}</span>
          </div>
        </div>

        {project.status === 'completed' && project.report && (
          <div className="rounded-[20px] border border-line bg-paper p-6 text-ink shadow-glass">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl bg-success-bg text-success"
              >
                <ShieldIcon width={18} height={18} />
              </span>
              <h2 className="font-display text-lg font-bold text-ink">
                Shaffoflik hisoboti — yig&apos;ildi, sarflandi, natija
              </h2>
            </div>
            <p className="mt-3 whitespace-pre-line font-sans text-sm text-ink">{project.report}</p>
          </div>
        )}

        {project.status === 'active' && <DonateForm projectId={project.id} />}

        {project.status === 'funded' && !project.report && (
          <div className="rounded-xl border border-line bg-paper p-5 shadow-glass">
            <p className="m-0 font-sans text-base text-ink-soft">
              Bu loyiha to&apos;liq moliyalashtirildi — hozir ijro bosqichida, natija hisoboti tez
              orada shu yerda e&apos;lon qilinadi.
            </p>
          </div>
        )}
      </div>
    </LandingSection>
  );
}
