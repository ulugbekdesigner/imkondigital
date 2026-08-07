import Link from 'next/link';
import { Badge, GlassCard, MatchScoreRing } from '@imkon/ui';
import type { ExternalJobCard } from '@/lib/types';

const SOURCE_LABEL: Record<string, string> = {
  remoteok: 'Remote OK',
  remotive: 'Remotive',
  weworkremotely: 'We Work Remotely',
};

const LADDER_LABEL: Record<number, string> = {
  0: 'Savodxonlik',
  1: 'Yordamchi',
  2: 'Mutaxassislik',
  3: 'IT',
  4: 'Tadbirkorlik',
};

export function ExternalJobItem({ job }: { job: ExternalJobCard }) {
  return (
    <li>
      <Link href={`/xalqaro-ishlar/${job.id}`} className="block h-full">
        <GlassCard hover className="flex h-full flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-semibold text-ink">
                {job.title_uz || job.title}
              </h3>
              <p className="font-sans text-sm text-ink-soft">{job.company_name}</p>
            </div>
            {job.match_score !== null && <MatchScoreRing value={job.match_score} size={40} />}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant="neutral">{SOURCE_LABEL[job.source] ?? job.source}</Badge>
            {job.ladder_step !== null && (
              <Badge variant="neutral">{LADDER_LABEL[job.ladder_step] ?? job.ladder_step}</Badge>
            )}
            {job.location_note && <Badge variant="neutral">{job.location_note}</Badge>}
          </div>
        </GlassCard>
      </Link>
    </li>
  );
}
