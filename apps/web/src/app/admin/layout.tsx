import type { ReactNode } from 'react';
import { CabinetShell, type CabinetNavItem } from '@/components/cabinet-shell';
import { ADMIN_NAV } from '@/components/cabinet-nav';
import { getMe } from '@/lib/server-api';
import { getAdminCompanies } from '@/lib/admin-api';

// IMKON Interface.dc.html 5a-blok — sidebar nav band'ida navbatda turgan ish
// soni bilan belgi (masalan "Kompaniyalar 2"). Faqat admin uchun (moderator
// /admin/kompaniyalar'ga kira olmaydi), va faqat haqiqiy tasdiqlanmagan
// kompaniyalar soni bo'lsa ko'rinadi — soxta/qattiq kodlangan raqam yo'q.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const me = await getMe();
  const isAdmin = me?.roles.includes('admin') ?? false;
  const unverifiedCompanies = isAdmin
    ? await getAdminCompanies({ verified: false, limit: 100 })
    : null;
  const companiesPending = unverifiedCompanies?.items.length ?? 0;

  const nav: CabinetNavItem[] = ADMIN_NAV.map((item) =>
    item.href === '/admin/kompaniyalar' && companiesPending > 0
      ? { ...item, badge: companiesPending }
      : item,
  );

  return (
    <CabinetShell nav={nav} title="Admin panel">
      {children}
    </CabinetShell>
  );
}
