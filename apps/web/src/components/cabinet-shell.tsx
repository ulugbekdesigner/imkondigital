'use client';
/* ============================================================
   IMKON DIGITAL — CabinetShell
   Ustoz/Admin kabineti skeleti — AsproCRM qolipida:
   chap sidebar → jadval/karta → qator bosilsa o'ngdan drawer.

   Navigatsiya ro'yxatlari FAQAT haqiqatan mavjud sahifalarga bog'lanadi.
   KENGAYISH_PLAN_3.md (1-bo'lim) to'liq Ustoz Kabineti 2.0'ni ta'riflaydi.
   Hozir mavjud: Dashboard (/ustoz/kurslar/dashboard — 3 ta HAQIQIY KPI:
   yangi o'quvchi/tekshirilmagan topshiriq/o'rtacha reyting — "Daromad"
   KPI'si ATAYLAB yo'q, chunki kurslarda to'lov integratsiyasi umuman
   yo'q, soxta raqam ko'rsatmaslik uchun), Kurslarim (/ustoz/kurslar,
   kurs ichida modul/dars konstruktori — LAYOUT_XARITA 4.7'dagi "Darslar
   konstruktori" ekraniga eng yaqin), O'quvchilarim (/ustoz/kurslar/
   oquvchilar — barcha kurslar bo'yicha, avval faqat bitta kurs ichida
   bor edi), Topshiriqlar (/ustoz/kurslar/topshiriqlar — HAQIQIY
   Submission/uyga-vazifa tekshirish navbati, avval bu funksiya UMUMAN
   UI'ga chiqarilmagan edi — faqat backend endpoint bor edi, hech qanday
   sahifa uni chaqirmasdi). Eski /ustoz/kurslar/baholash (yakuniy imtihon
   AI-baho tasdiqlash navbati — boshqa tizim, Submission bilan aralashtirib
   bo'lmaydi) sidebar'da EMAS, lekin Kurslarim sahifasidagi "Baholash
   navbati →" havolasi orqali hamon ochiladi. Sharhlar (/ustoz/kurslar/
   sharhlar — kurslararo, avval faqat /ustoz/kurslar/[id]/talabalar
   ichida edi), Jonli darslar (/ustoz/kurslar/jonli-darslar — LiveLesson
   modeli, Zoom/Meet havolasi bilan, o'quvchiga kurs sahifasida ham
   ko'rinadi) va Sozlamalar (/ustoz/kurslar/sozlamalar — Telegram
   bildirishnoma + ma'lumotlar eksporti) 2026-08-01'da qo'shildi. Hali
   qurilmagani: Daromad (kurslarda to'lov integratsiyasi yo'qligicha
   qoladi). Admin nav ham xuddi shunday —
   mavjud /admin/ustozlar, /admin/kompaniyalar, /admin/audit-jurnali
   qo'shildi (asl ro'yxatda yo'q edi), mavjud bo'lmagan "Kurslar
   moderatsiyasi"/"Tekshiruvlar"/"Statistika"/"Sozlamalar" olib tashlandi
   (bularning barchasi hozircha /admin bosh sahifasining o'zida —
   umumiy ko'rsatkichlar + moderatsiya navbati bitta ekranda).

   Vizual qobiq — IMKON Interface.dc.html 5a/4d-blok ("Robot Aurora"):
   quyuq (#101a33/bg-deep) 240px sidebar, 64px logo+sarlavha qatori,
   44px nav band (faol — chapda 3px teal chiziq + oq/10% fon), o'ngda
   64px oq topbar (sarlavha + sahifaga xos harakatlar).

   Ishlatish:
     <CabinetShell nav={USTOZ_NAV} title="Ustoz kabineti">...</CabinetShell>

   Nav ro'yxatlari (USTOZ_NAV/ADMIN_NAV/EMPLOYER_NAV) shu faylda EMAS —
   @/components/cabinet-nav'da (server layout'lar ularga .map() chaqiradi,
   bu fayl 'use client' bo'lgani uchun mumkin emas edi — pastdagi izohga q.).
   ============================================================ */
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@imkon/ui';
import { CloseIcon, LogoutIcon, MenuIcon } from '@/components/shell-icons';
import type { CabinetNavItem } from '@/components/cabinet-nav';

export type { CabinetNavItem };

export function CabinetShell({
  nav,
  title,
  topbarActions,
  children,
}: {
  nav: CabinetNavItem[];
  title: string;
  topbarActions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  // Eng aniq (eng uzun) mos keluvchi href — aks holda "/ustoz/kurslar" kabi
  // qisqa yo'l o'zining "/ustoz/kurslar/dashboard" kabi jiyani sahifasida ham
  // faol bo'lib qolar edi.
  const matchingHref = nav
    .map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(href + '/'))
    .sort((a, b) => b.length - a.length)[0];
  const isActive = (href: string) => href === matchingHref;

  // Sahifa almashganda (nav'dan bosilganda) mobil tortmani avtomatik yopish.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Escape — klaviatura orqali yopish (mavjud drawer/modal naqshiga mos).
  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  const navList = (
    <nav className="flex flex-col gap-0.5 overflow-y-auto px-3 pb-5">
      {nav.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex h-11 items-center gap-3 rounded px-4 font-sans text-base',
              active ? 'bg-white/10 font-bold text-white' : 'text-mist hover:bg-white/5 hover:text-white',
            )}
          >
            {active && (
              <span
                aria-hidden="true"
                className="absolute left-0 top-1/4 h-1/2 w-[3px] rounded-full bg-teal"
              />
            )}
            <span
              aria-hidden="true"
              className={cn('flex w-5 shrink-0 items-center justify-center', active && 'text-teal')}
            >
              {item.icon}
            </span>
            <span className="flex-1 truncate">{item.label}</span>
            {typeof item.badge === 'number' && item.badge > 0 && (
              <span
                className={cn(
                  'animate-dot-pulse inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 font-sans text-xs font-bold motion-reduce:animate-none',
                  active ? 'bg-error text-error-fg' : 'bg-white/15 text-deep-fg',
                )}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-dvh bg-paper">
      {/* Mobil topbar — faqat <lg. left-0+width:100vw (right:0 emas) —
          html'dagi overflow-x:hidden bilan Chromium'ning fixed elementni
          tozalanmagan kenglikka nisbatan o'lchash xatosidan himoya. */}
      <header className="fixed left-0 top-0 z-40 flex h-14 w-screen items-center gap-3 border-b border-line bg-paper px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Navigatsiyani ochish"
          aria-expanded={mobileOpen}
          aria-controls="cab-mobile-sidebar"
          className="flex min-h-touch min-w-touch items-center justify-center rounded-full text-ink-soft hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <MenuIcon width={20} height={20} />
        </button>
        <span className="truncate font-display text-md font-bold text-ink">{title}</span>
      </header>

      {mobileOpen && (
        <div
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
          className="fixed left-0 top-0 z-40 h-dvh w-screen bg-ink/30 lg:hidden"
        />
      )}

      <aside
        id="cab-mobile-sidebar"
        className={cn(
          'fixed left-0 top-0 z-50 flex h-dvh w-[min(20rem,85vw)] -translate-x-full flex-col bg-deep transition-transform duration ease motion-reduce:transition-none',
          mobileOpen && 'translate-x-0',
          'lg:sticky lg:top-0 lg:z-0 lg:h-dvh lg:w-60 lg:shrink-0 lg:translate-x-0',
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-2.5 px-4">
          <img src="/brand/imkon-mark-white.svg" alt="" aria-hidden="true" width={28} height={28} className="h-7 w-7 shrink-0" />
          <span className="flex-1 truncate font-display text-md font-bold text-white">{title}</span>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Navigatsiyani yopish"
            className="flex min-h-touch min-w-touch items-center justify-center rounded-full text-mist hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus lg:hidden"
          >
            <CloseIcon width={18} height={18} />
          </button>
        </div>
        {navList}
        <div className="mt-auto px-3 pb-4">
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className="flex h-11 w-full items-center gap-3 rounded px-4 font-sans text-base text-mist hover:bg-white/5 hover:text-white disabled:opacity-60"
          >
            <span aria-hidden="true" className="flex w-5 shrink-0 items-center justify-center">
              <LogoutIcon width={20} height={20} />
            </span>
            <span className="truncate">{loggingOut ? 'Chiqilmoqda…' : 'Chiqish'}</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 hidden h-16 shrink-0 items-center justify-between border-b border-line bg-paper px-7 lg:flex">
          <span className="truncate font-display text-xl font-bold tracking-tight text-ink">{title}</span>
          {topbarActions && <div className="flex items-center gap-3">{topbarActions}</div>}
        </header>
        <main className="min-w-0 flex-1 p-4 pt-[calc(3.5rem+1rem)] lg:p-8 lg:pt-8">{children}</main>
      </div>
    </div>
  );
}

/* ============================================================
   CabinetPageHeader — kabinet sahifasining standart boshi.
   ("PageHeader" nomi @/components/page-header.tsx'da band —
   u marketing-uslub hero sarlavha, bu esa kabinet ichi uchun.)
   Qoida: h1 bitta, primary tugma bitta, o'ngda.
   ============================================================ */
export function CabinetPageHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="m-0 flex flex-wrap items-center gap-2 font-display text-xl font-bold tracking-tight text-ink">
          {title}
        </h1>
        {subtitle && <p className="mt-2 font-sans text-base text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

/* ============================================================
   TableDrawerLayout — AsproCRM oqimi: qator → drawer.
   Minimal skelet; ustunlar/kontentni har sahifa o'zi beradi.
   ============================================================ */
export function TableDrawerLayout({
  table,
  drawer,
  drawerOpen,
  onClose,
  drawerTitle,
}: {
  table: ReactNode;
  drawer: ReactNode;
  drawerOpen: boolean;
  onClose: () => void;
  drawerTitle: string;
}) {
  return (
    <>
      {table}
      {drawerOpen && (
        <>
          <div
            onClick={onClose}
            aria-hidden
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100dvh',
              background: 'rgba(0,0,0,.3)',
              zIndex: 'calc(var(--z-drawer) - 1)',
            }}
          />
          <aside
            role="dialog"
            aria-label={drawerTitle}
            style={{
              position: 'fixed',
              right: 0,
              top: 0,
              height: '100dvh',
              width: 'min(var(--w-drawer), 100vw)',
              background: 'var(--c-surface)',
              zIndex: 'var(--z-drawer)',
              display: 'flex',
              flexDirection: 'column',
              borderLeft: '1px solid var(--c-line)',
            }}
          >
            <header
              style={{
                height: 'var(--h-topbar)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 var(--sp-6)',
                borderBottom: '1px solid var(--c-line)',
              }}
            >
              <span className="t-h3">{drawerTitle}</span>
              <button className="btn btn--icon btn--ghost" aria-label="Yopish" onClick={onClose}>
                <CloseIcon width={18} height={18} />
              </button>
            </header>
            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--sp-6)' }}>{drawer}</div>
          </aside>
        </>
      )}
      <style jsx global>{`
        .table { width: 100%; border-collapse: collapse; }
        .table th {
          height: var(--h-table-head); text-align: left; padding: 0 var(--sp-4);
          font-size: var(--fs-body-sm); font-weight: var(--fw-semibold);
          color: var(--c-ink-soft); border-bottom: 1px solid var(--c-line);
          position: sticky; top: 0; background: var(--c-bg);
        }
        .table td {
          height: var(--h-table-row); padding: 0 var(--sp-4);
          font-size: var(--fs-body-sm); border-bottom: 1px solid var(--c-line);
        }
        .table tbody tr { cursor: pointer; }
        .table tbody tr:hover { background: color-mix(in srgb, var(--c-line) 30%, transparent); }
      `}</style>
    </>
  );
}
