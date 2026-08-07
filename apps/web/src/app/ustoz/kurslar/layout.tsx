import type { ReactNode } from 'react';

import { CabinetShell } from '@/components/cabinet-shell';
import { USTOZ_NAV } from '@/components/cabinet-nav';
import { getInstructorSubmissions } from '@/lib/instructor-studio-api';

export default async function UstozKurslarLayout({ children }: { children: ReactNode }) {
  const pending = await getInstructorSubmissions('submitted');
  const nav = USTOZ_NAV.map((item) =>
    item.href === '/ustoz/kurslar/topshiriqlar' && pending.length > 0
      ? { ...item, badge: pending.length }
      : item,
  );
  return (
    <CabinetShell nav={nav} title="Ustoz kabineti">
      {children}
    </CabinetShell>
  );
}
