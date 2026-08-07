import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { GlassCard, CardHeader, CardTitle, CardDescription } from '@imkon/ui';
import { getMe } from '@/lib/server-api';
import { getTelegramStatus } from '@/lib/notifications-api';
import { BecomeInstructorButton } from '@/components/become-instructor-button';
import { CabinetPageHeader } from '@/components/cabinet-shell';
import { TelegramLinkPanel } from '@/components/telegram-link-panel';
import { DataExportButton } from '@/components/data-export-button';

export const metadata: Metadata = {
  title: 'Sozlamalar — Ustoz kabineti',
  robots: { index: false },
};

export default async function InstructorSettingsPage() {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/ustoz/kurslar/sozlamalar');

  if (!me.roles.includes('instructor') && !me.roles.includes('admin')) {
    return (
      <div className="mx-auto max-w-2xl">
        <CabinetPageHeader title="Sozlamalar" />
        <BecomeInstructorButton />
      </div>
    );
  }

  const telegramStatus = await getTelegramStatus();

  return (
    <div className="mx-auto max-w-2xl">
      <CabinetPageHeader title="Sozlamalar" />

      <GlassCard className="p-6">
        <CardHeader>
          <CardTitle>Telegram bildirishnomalar</CardTitle>
          <CardDescription>
            Yangi o'quvchi, topshiriq va sharh haqida Telegram orqali xabar oling.
          </CardDescription>
        </CardHeader>
        <TelegramLinkPanel initiallyLinked={telegramStatus.linked} />
      </GlassCard>

      <GlassCard className="mt-6 p-6">
        <CardHeader>
          <CardTitle>Mening ma'lumotlarim</CardTitle>
          <CardDescription>
            Profilingiz, kurslaringiz va faoliyatingiz haqidagi to'liq ma'lumotni yuklab oling.
          </CardDescription>
        </CardHeader>
        <DataExportButton />
      </GlassCard>
    </div>
  );
}
