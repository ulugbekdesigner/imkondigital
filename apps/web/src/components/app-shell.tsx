'use client';
/* ============================================================
   IMKON DIGITAL — AppShell
   Login qilingan foydalanuvchi ilovasining skeleti (LAYOUT_XARITA.md
   3-bo'lim). Faqat haqiqatan mavjud sahifalarga bog'lanadi — "Tillar"
   bo'limi hali qurilmagani uchun (KENGAYISH_PLAN_3.md, 3-bo'lim: hali
   yo'q) navigatsiyada YO'Q, keyinroq shu bo'lim qurilganda qo'shiladi.
   Ziyo FAB/panel bu yerda QAYTA yozilmaydi — u allaqachon <ZiyoWidget />
   sifatida root layout.tsx'da global render qilinadi (ikki marta
   ko'rsatib qo'ymaslik uchun shu komponent uni umuman chizmaydi).

   Vizual qobiq — IMKON Interface.dc.html 4d-blok ("Robot Aurora"):
   quyuq (bg-deep) 240px sidebar, IMKON logotip, 44px nav band. Topbar'da
   spec o'zining qulaylik-tugmalar klasterini ham ko'rsatadi — bu yerda
   ATAYLAB qoldirilgan, chunki xuddi shu funksiya (tema/kontrast/shrift)
   AccessibilityBar orqali allaqachon HAR sahifada, shu joydan tepada,
   global ko'rsatilyapti — ikkinchi nusxasi shunchaki takror bo'lardi.
   O'rniga topbar haqiqiy, hali qoplanmagan narsalarga e'tibor beradi:
   qidiruv, real bildirishnoma-hisoblagich, real foydalanuvchi avatari.

   Ishlatish: apps/web/src/app/(app)/layout.tsx ichida
   <AppShell fullName={me?.full_name} avatarUrl={me?.avatar_url} unreadCount={n}>.
   ============================================================ */
import { type ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@imkon/ui';
import {
  BellIcon,
  BookIcon,
  BriefcaseIcon,
  GearIcon,
  HeartIcon,
  LogoutIcon,
  RouteIcon,
  SearchIcon,
} from '@/components/shell-icons';
import { OnboardingTour } from '@/components/onboarding-tour';

const NAV_MAIN = [
  { href: '/mening-yolim', label: "Yo'lim", Icon: RouteIcon },
  { href: '/kurslar', label: "O'qish", Icon: BookIcon },
  { href: '/vakansiyalar', label: 'Ish', Icon: BriefcaseIcon },
];
const NAV_SECONDARY = [
  { href: '/xayriya', label: 'Xayriya', Icon: HeartIcon },
  { href: '/bildirishnomalar', label: 'Bildirishnomalar', Icon: BellIcon },
];
const NAV_MOBILE = NAV_MAIN;

const ALL_NAV_HREFS = [...NAV_MAIN, ...NAV_SECONDARY].map((item) => item.href);

function initialOf(name: string | null): string {
  return name ? name.trim().charAt(0).toUpperCase() : '?';
}

export function AppShell({
  fullName = null,
  avatarUrl = null,
  unreadCount = 0,
  children,
}: {
  fullName?: string | null;
  avatarUrl?: string | null;
  unreadCount?: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  const matchingHref = ALL_NAV_HREFS.filter(
    (href) => pathname === href || pathname.startsWith(href + '/'),
  ).sort((a, b) => b.length - a.length)[0];
  const isActive = (href: string) => href === matchingHref;

  const navItemClass = (active: boolean) =>
    cn(
      'relative flex h-11 items-center gap-3 rounded px-4 font-sans text-base',
      active ? 'bg-white/10 font-bold text-white' : 'text-mist hover:bg-white/5 hover:text-white',
    );

  const navIconClass = (active: boolean) =>
    cn('flex w-5 shrink-0 items-center justify-center', active && 'text-teal');

  return (
    <div className="flex min-h-dvh bg-paper">
      <aside
        className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-deep md:flex md:w-[72px] lg:w-60"
      >
        <Link href="/mening-yolim" className="flex h-16 shrink-0 items-center gap-2.5 px-4 md:justify-center lg:justify-start">
          <img src="/brand/imkon-mark-white.svg" alt="" aria-hidden="true" width={28} height={28} className="h-7 w-7 shrink-0" />
          <span className="hidden font-display text-md font-bold tracking-tight text-white lg:inline">
            IMKON
          </span>
        </Link>

        <nav
          aria-label="Asosiy"
          data-tour="sidebar-nav"
          className="flex flex-col gap-0.5 px-3"
        >
          {NAV_MAIN.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={navItemClass(active)}>
                {active && <span aria-hidden="true" className="absolute left-0 top-1/4 h-1/2 w-[3px] rounded-full bg-teal md:hidden lg:block" />}
                <span aria-hidden="true" className={navIconClass(active)}>
                  <item.Icon width={20} height={20} />
                </span>
                <span className="hidden truncate lg:inline">{item.label}</span>
              </Link>
            );
          })}
          <div role="separator" aria-hidden="true" className="h-6" />
          {NAV_SECONDARY.map((item) => {
            const active = isActive(item.href);
            const isNotifications = item.href === '/bildirishnomalar';
            return (
              <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={navItemClass(active)}>
                {active && <span aria-hidden="true" className="absolute left-0 top-1/4 h-1/2 w-[3px] rounded-full bg-teal md:hidden lg:block" />}
                <span aria-hidden="true" className={navIconClass(active)}>
                  <item.Icon width={20} height={20} />
                </span>
                <span className="hidden flex-1 truncate lg:inline">{item.label}</span>
                {isNotifications && unreadCount > 0 && (
                  <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-error px-1.5 font-sans text-xs font-bold text-error-fg">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-0.5 px-3 pb-4">
          <Link href="/profil" className={navItemClass(isActive('/profil'))}>
            <span
              aria-hidden="true"
              className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full font-sans text-xs font-bold text-white"
              style={{ background: 'linear-gradient(140deg, rgb(var(--imkon-teal)), rgb(var(--imkon-bright)))' }}
            >
              {initialOf(fullName)}
            </span>
            <span className="hidden truncate lg:inline">{fullName ?? 'Profil'}</span>
          </Link>
          {/* "Sozlamalar" alohida sahifa sifatida hali qurilmagan — profildagi
              "Sozlamalar" tabiga (Telegram/eksport) to'g'ridan-to'g'ri
              yo'naltiradi (ProfileTabs hash orqali tegishli tabni ochadi). */}
          <Link href="/profil#sozlamalar" className={navItemClass(false)}>
            <span aria-hidden="true" className={navIconClass(false)}>
              <GearIcon width={20} height={20} />
            </span>
            <span className="hidden truncate lg:inline">Sozlamalar</span>
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className={cn(navItemClass(false), 'w-full disabled:opacity-60')}
          >
            <span aria-hidden="true" className={navIconClass(false)}>
              <LogoutIcon width={20} height={20} />
            </span>
            <span className="hidden truncate lg:inline">
              {loggingOut ? 'Chiqilmoqda…' : 'Chiqish'}
            </span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-end gap-3 border-b border-line bg-paper px-4 md:h-16 md:px-8">
          <Link
            href="/qidiruv"
            aria-label="Qidiruv"
            className="hidden h-10 w-80 items-center gap-2.5 rounded-full border border-line px-4 font-sans text-sm text-ink-soft hover:bg-surface-2 sm:flex"
          >
            <SearchIcon width={18} height={18} />
            Qidiruv…
            <span className="ml-auto rounded border border-line px-1.5 py-0.5 font-mono text-xs font-semibold">
              ⌘K
            </span>
          </Link>
          <Link
            href="/qidiruv"
            aria-label="Qidiruv"
            className="flex min-h-touch min-w-touch items-center justify-center rounded-full text-ink-soft hover:bg-surface-2 sm:hidden"
          >
            <SearchIcon width={20} height={20} />
          </Link>
          <Link
            href="/bildirishnomalar"
            aria-label={unreadCount > 0 ? `Bildirishnomalar (${unreadCount} ta yangi)` : 'Bildirishnomalar'}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-ink-soft hover:bg-surface-2"
          >
            <BellIcon width={20} height={20} />
            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error"
              />
            )}
          </Link>
          <Link href="/profil" aria-label="Profil">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-full font-sans text-sm font-bold text-white"
                style={{ background: 'linear-gradient(140deg, rgb(var(--imkon-teal)), rgb(var(--imkon-bright)))' }}
              >
                {initialOf(fullName)}
              </span>
            )}
          </Link>
        </header>

        <main id="content" className="w-full flex-1 px-4 py-4 pb-24 md:px-8 md:py-8 md:pb-8">
          {children}
        </main>
      </div>

      <nav
        aria-label="Asosiy (mobil)"
        data-tour="sidebar-nav"
        className="fixed bottom-0 left-0 z-40 flex h-[calc(4rem+env(safe-area-inset-bottom))] w-screen border-t border-line bg-paper pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {NAV_MOBILE.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 font-sans text-xs font-medium',
                active ? 'text-primary' : 'text-ink-soft',
              )}
            >
              <item.Icon width={24} height={24} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <OnboardingTour />
    </div>
  );
}
