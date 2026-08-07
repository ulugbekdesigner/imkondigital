import Link from 'next/link';
import { buttonVariants } from '@imkon/ui';
import { getAccessToken } from '@/lib/session';
import { NAV_LINKS, NAV_PRIMARY_HREFS } from './nav-links';
import { MobileMenu } from './mobile-menu';
import { NavMoreMenu } from './nav-more-menu';
import { NotificationBell } from './notification-bell';
import { SearchIcon } from './shell-icons';

const NAV_PRIMARY = NAV_LINKS.filter((l) => NAV_PRIMARY_HREFS.includes(l.href));
const NAV_MORE = NAV_LINKS.filter((l) => !NAV_PRIMARY_HREFS.includes(l.href));

export function PublicHeader() {
  const authed = Boolean(getAccessToken());

  return (
    <header className="imk-public-header relative border-b border-line bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 whitespace-nowrap font-display text-lg font-bold text-ink">
          <img
            src="/brand/imkon-mark-color.svg"
            alt=""
            aria-hidden="true"
            width={26}
            height={26}
            className="imk-header-logo-color h-[26px] w-[26px] shrink-0"
          />
          <img
            src="/brand/imkon-mark-white.svg"
            alt=""
            aria-hidden="true"
            width={26}
            height={26}
            className="imk-header-logo-white hidden h-[26px] w-[26px] shrink-0"
          />
          IMKON<span className="text-primary"> Digital</span>
        </Link>

        <nav aria-label="Asosiy menyu" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_PRIMARY.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="flex min-h-touch items-center whitespace-nowrap rounded px-3 font-sans text-base text-ink hover:bg-mint"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <NavMoreMenu items={NAV_MORE} />
            </li>
          </ul>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/qidiruv"
            aria-label="Qidiruv"
            className="flex min-h-touch min-w-touch items-center justify-center rounded-full text-ink-soft hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <SearchIcon />
          </Link>
          {authed ? (
            <>
              <NotificationBell />
              <Link href="/profil" className={buttonVariants({ size: 'sm' })}>
                Profil
              </Link>
            </>
          ) : (
            <>
              <Link href="/kirish" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                Kirish
              </Link>
              <Link href="/royxatdan-otish" className={buttonVariants({ size: 'sm' })}>
                Ro‘yxatdan o‘tish
              </Link>
            </>
          )}
        </div>

        <MobileMenu authed={authed} />
      </div>
    </header>
  );
}
