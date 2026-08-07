import type { ReactNode } from 'react';
import { CabinetShell } from '@/components/cabinet-shell';
import { EMPLOYER_NAV } from '@/components/cabinet-nav';

export default function IshBeruvchiLayout({ children }: { children: ReactNode }) {
  return (
    <CabinetShell nav={EMPLOYER_NAV} title="Ish beruvchi kabineti">
      {children}
    </CabinetShell>
  );
}
