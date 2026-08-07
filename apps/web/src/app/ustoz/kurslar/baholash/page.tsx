import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getMe } from '@/lib/server-api';
import { getMentorReviewQueue } from '@/lib/assessment-api';
import { MentorAssessmentReview } from '@/components/mentor-assessment-review';
import { CabinetPageHeader } from '@/components/cabinet-shell';
import { CheckIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Baholash navbati',
  robots: { index: false },
};

export default async function MentorAssessmentQueuePage() {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/ustoz/kurslar/baholash');
  if (!me.roles.includes('instructor') && !me.roles.includes('admin')) {
    redirect('/kurslar');
  }

  const queue = await getMentorReviewQueue(true);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <CabinetPageHeader
        title="Baholash navbati"
        subtitle="O'quvchilaringizning yakuniy amaliy imtihonlarini AI dastlabki tahlili bilan ko'rib chiqing va yakuniy xulosani tasdiqlang."
        action={
          queue.length > 0 ? (
            <span
              aria-label={`Navbatda ${queue.length} ta`}
              className="inline-flex h-9 items-center rounded-full bg-primary px-3 font-mono text-sm font-semibold text-primary-fg"
            >
              {queue.length}
            </span>
          ) : undefined
        }
      />

      {queue.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {queue.map((item) => (
            <MentorAssessmentReview key={item.assessment.id} item={item} />
          ))}
        </ul>
      ) : (
        <div className="imk-empty">
          <span className="imk-empty__icon" aria-hidden="true">
            <CheckIcon width={22} height={22} />
          </span>
          <p className="font-sans text-base font-medium text-ink">Hozircha kutilayotgan baholash yo'q</p>
          <p className="max-w-sm font-sans text-sm text-ink-soft">
            O'quvchi yakuniy amaliy imtihonni topshirganda shu yerda ko'rinadi.
          </p>
        </div>
      )}
    </div>
  );
}
