import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { getMyNotifications } from '@/lib/notifications-api';
import { getMe } from '@/lib/server-api';

export default async function AppGroupLayout({ children }: { children: ReactNode }) {
  const [me, notifications] = await Promise.all([getMe(), getMyNotifications()]);
  return (
    <AppShell
      fullName={me?.full_name ?? null}
      avatarUrl={me?.avatar_url ?? null}
      unreadCount={notifications.unread_count}
    >
      {children}
    </AppShell>
  );
}
