'use client';

import { useState } from 'react';
import Link from 'next/link';
import { buttonVariants, cn } from '@imkon/ui';
import { NAV_LINKS } from './nav-links';

export function MobileMenu({ authed }: { authed: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Menyuni yopish' : 'Menyuni ochish'}
        className="flex min-h-touch min-w-touch items-center justify-center rounded border border-line text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {open && (
        <div
          id="mobile-menu"
          className="imk-header-popover absolute inset-x-0 top-full z-[var(--z-drawer)] border-b border-line bg-paper p-4 shadow-sm"
        >
          <nav aria-label="Asosiy menyu">
            <ul className="flex flex-col gap-1">
              <li>
                <Link
                  href="/qidiruv"
                  onClick={() => setOpen(false)}
                  className="flex min-h-touch items-center rounded px-3 font-sans text-base text-ink hover:bg-mint"
                >
                  Qidiruv
                </Link>
              </li>
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-touch items-center rounded px-3 font-sans text-base text-ink hover:bg-mint"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-3 flex flex-col gap-2">
            {authed ? (
              <>
                <Link
                  href="/bildirishnomalar"
                  onClick={() => setOpen(false)}
                  className={cn(buttonVariants({ variant: 'outline' }))}
                >
                  Bildirishnomalar
                </Link>
                <Link href="/profil" onClick={() => setOpen(false)} className={buttonVariants()}>
                  Profil
                </Link>
              </>
            ) : (
              <>
                <Link href="/kirish" onClick={() => setOpen(false)} className={cn(buttonVariants({ variant: 'outline' }))}>
                  Kirish
                </Link>
                <Link href="/royxatdan-otish" onClick={() => setOpen(false)} className={buttonVariants()}>
                  Ro‘yxatdan o‘tish
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
