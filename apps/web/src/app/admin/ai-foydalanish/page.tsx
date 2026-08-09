import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CountUp } from '@imkon/ui';
import { getMe } from '@/lib/server-api';
import { getAdminAiUsage } from '@/lib/admin-api';
import { CabinetPageHeader } from '@/components/cabinet-shell';
import { RegistrationsBarChart } from '@/components/registrations-bar-chart';
import { ErrorState } from '@/components/state-panels';
import { SparkIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'AI foydalanish — Admin',
  robots: { index: false },
};

const FEATURE_LABEL: Record<string, string> = {
  career_coach: 'Karyera Coach',
  cv_builder: 'CV yaratish',
  interview_coach: 'Suhbat mashqi',
  study_buddy: 'Study Buddy',
  exam_grader: 'Imtihon baholovchi',
  ziyo: 'Ziyo',
  case_story: 'Case-hikoya',
  placement_test: 'Daraja testi',
};

export default async function AdminAiUsagePage() {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/admin/ai-foydalanish');
  if (!me.roles.includes('admin')) redirect('/admin');

  const data = await getAdminAiUsage();

  if (!data) {
    return (
      <div className="max-w-4xl">
        <CabinetPageHeader title="AI foydalanish" />
        <ErrorState />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <CabinetPageHeader
        title="AI foydalanish"
        subtitle="Ziyo, Karyera Coach va boshqa AI xususiyatlarining jami va kunlik ishlatilishi."
      />

      {data.by_feature.length > 0 ? (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {data.by_feature.map((f) => (
            <div
              key={f.feature}
              className="flex flex-col gap-1.5 rounded-card border border-line bg-paper p-[18px]"
            >
              <SparkIcon width={16} height={16} className="text-ink-soft" />
              <CountUp value={f.total_count} className="font-mono text-xl font-bold tabular-nums text-ink" />
              <p className="font-sans text-xs font-bold uppercase tracking-wide text-ink-soft">
                {FEATURE_LABEL[f.feature] ?? f.feature}
              </p>
              <p className="font-sans text-xs text-ink-soft">{f.active_users} ta foydalanuvchi</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="font-sans text-base text-ink-soft">Hali AI so&apos;rovlari qayd etilmagan.</p>
      )}

      <div className="mt-6">
        <RegistrationsBarChart days={data.daily_total} title="AI so'rovlari · 7 kun" />
      </div>
    </div>
  );
}
