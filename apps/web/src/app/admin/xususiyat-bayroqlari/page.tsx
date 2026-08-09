import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getMe } from '@/lib/server-api';
import { getAdminFeatureFlags } from '@/lib/admin-api';
import { CabinetPageHeader } from '@/components/cabinet-shell';
import { FeatureFlagsManager } from '@/components/feature-flags-manager';
import { ErrorState } from '@/components/state-panels';

export const metadata: Metadata = {
  title: "Xususiyat bayroqlari — Admin",
  robots: { index: false },
};

export default async function AdminFeatureFlagsPage() {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/admin/xususiyat-bayroqlari');
  if (!me.roles.includes('admin')) redirect('/admin');

  const flags = await getAdminFeatureFlags();

  return (
    <div className="max-w-4xl">
      <CabinetPageHeader
        title="Xususiyat bayroqlari"
        subtitle="Yangi funksiyalarni xavfsiz, bosqichma-bosqich yoqing: avval 0%, keyin foizli rollout, keyin 100%."
      />
      {flags === null ? <ErrorState /> : <FeatureFlagsManager initialFlags={flags} />}
    </div>
  );
}
