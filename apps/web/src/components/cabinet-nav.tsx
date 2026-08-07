/* ============================================================
   IMKON DIGITAL — CabinetShell nav data
   AYIRIB CHIQARILDI cabinet-shell.tsx'dan (u 'use client'). Server
   layout'lar (masalan ustoz/kurslar/layout.tsx, admin/layout.tsx)
   bu ro'yxatlarga .map() chaqiradi (badge hisoblash uchun) — agar bu
   ma'lumot 'use client' fayldan eksport qilinsa, butun eksport server
   tomonida Client Reference'ga aylanadi va .map() "Attempted to call
   map() from the server but map is on the client" xatosi bilan
   qulaydi (bu SHUNCHAKI RSC cheklovi, dizayn qarori emas). Shu sabab
   ro'yxatlar ('use client' bo'lmagan) shu faylda, CabinetShell
   komponenti esa cabinet-shell.tsx'da qoladi.

   `icon` maydoni ATAYLAB komponent REFERENSI (masalan `Icon:
   DashboardIcon`) emas, balki OLDINDAN RENDER QILINGAN element
   (`<DashboardIcon .../>`) — chunki xom funksiya referensini Server
   Component'dan Client Component'ga prop sifatida uzatib bo'lmaydi
   ("Functions cannot be passed directly to Client Components" xatosi),
   render qilingan React elementni esa mumkin.
   ============================================================ */
import type { ReactNode } from 'react';
import {
  BookIcon,
  BriefcaseIcon,
  BuildingIcon,
  ClipboardIcon,
  DashboardIcon,
  GearIcon,
  LogIcon,
  ShieldIcon,
  StarIcon,
  UsersIcon,
  VideoIcon,
} from '@/components/shell-icons';

export type CabinetNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number;
};

export const USTOZ_NAV: CabinetNavItem[] = [
  { href: '/ustoz/kurslar/dashboard', label: 'Dashboard', icon: <DashboardIcon width={20} height={20} /> },
  { href: '/ustoz/kurslar', label: 'Kurslarim', icon: <BookIcon width={20} height={20} /> },
  { href: '/ustoz/kurslar/oquvchilar', label: "O'quvchilarim", icon: <UsersIcon width={20} height={20} /> },
  { href: '/ustoz/kurslar/topshiriqlar', label: 'Topshiriqlar', icon: <ClipboardIcon width={20} height={20} /> },
  { href: '/ustoz/kurslar/sharhlar', label: 'Sharhlar', icon: <StarIcon width={20} height={20} /> },
  { href: '/ustoz/kurslar/jonli-darslar', label: 'Jonli darslar', icon: <VideoIcon width={20} height={20} /> },
  { href: '/ustoz/kurslar/sozlamalar', label: 'Sozlamalar', icon: <GearIcon width={20} height={20} /> },
];

export const ADMIN_NAV: CabinetNavItem[] = [
  { href: '/admin', label: 'Boshqaruv paneli', icon: <ShieldIcon width={20} height={20} /> },
  { href: '/admin/foydalanuvchilar', label: 'Foydalanuvchilar', icon: <UsersIcon width={20} height={20} /> },
  { href: '/admin/ustozlar', label: 'Ustozlar', icon: <BookIcon width={20} height={20} /> },
  { href: '/admin/kompaniyalar', label: 'Kompaniyalar', icon: <BuildingIcon width={20} height={20} /> },
  { href: '/admin/audit-jurnali', label: 'Audit jurnali', icon: <LogIcon width={20} height={20} /> },
];

// Ish beruvchi kabineti hozircha bitta ekrandan iborat (vakansiyalar +
// nomzodlar + KPI bitta sahifada) — shu sabab bitta nav band, lekin
// CabinetShell'ning o'zi (quyuq #101a33 sidebar + oq topbar) ADMIN_NAV va
// USTOZ_NAV bilan bir xil "Robot Aurora" qobiqni beradi, avval ish beruvchi
// bu qobiqsiz, o'zining bg-deep gero-panelidan foydalanardi (4i-blok bilan
// vizual mos kelmasdi).
export const EMPLOYER_NAV: CabinetNavItem[] = [
  { href: '/ish-beruvchi', label: 'Boshqaruv paneli', icon: <BriefcaseIcon width={20} height={20} /> },
];
