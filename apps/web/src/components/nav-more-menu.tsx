'use client';
/* ============================================================
   IMKON DIGITAL — NavMoreMenu
   Desktop PublicHeader'dagi ikkilamchi bo'limlar uchun "Ko'proq"
   ochiladigan menyu. 9-11 ta yassi navigatsiya bo'limini bitta
   qatorga sig'dirishga urinish ularning matni ikki qatorga bukilib
   ketishiga sabab bo'lgan edi (nav-links.ts'dagi NAV_PRIMARY_HREFS
   izohiga qarang) — shu sabab kamroq muhim bo'limlar shu yerga
   ko'chirildi.
   ============================================================ */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { NavLink } from './nav-links';
import { ChevronDownIcon } from './shell-icons';

export function NavMoreMenu({ items }: { items: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-touch items-center gap-1 rounded px-3 font-sans text-base text-ink hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      >
        Ko'proq
        <ChevronDownIcon width={16} height={16} className={open ? 'rotate-180' : ''} />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Qo'shimcha bo'limlar"
          className="imk-header-popover absolute left-0 top-full z-[var(--z-drawer)] mt-1 min-w-[220px] rounded-lg border border-line bg-paper p-1.5 shadow-lg"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex min-h-touch items-center rounded px-3 font-sans text-base text-ink hover:bg-mint"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
