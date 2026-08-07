import Link from 'next/link';
import { NAV_LINKS } from './nav-links';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-deep text-mist">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div className="sm:col-span-2 md:col-span-1">
          <p className="flex items-center gap-2 font-display text-lg font-bold text-deep-fg">
            <img
              src="/brand/imkon-mark-white.svg"
              alt=""
              aria-hidden="true"
              width={24}
              height={24}
              className="h-6 w-6 shrink-0"
            />
            IMKON Digital
          </p>
          <p className="mt-2 max-w-xs font-sans text-base text-mist">
            Raqamli kasb — chegarasiz imkoniyat. O‘zbekistonda nogironligi bor insonlar uchun
            inklyuziv raqamli karyera platformasi.
          </p>
        </div>

        <nav aria-label="Sahifalar">
          <h2 className="font-sans text-base font-semibold text-deep-fg">Sahifalar</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="font-sans text-base text-mist underline-offset-4 hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Hisob">
          <h2 className="font-sans text-base font-semibold text-deep-fg">Hisob</h2>
          <ul className="mt-3 flex flex-col gap-2">
            <li>
              <Link href="/kirish" className="font-sans text-base text-mist underline-offset-4 hover:underline">
                Kirish
              </Link>
            </li>
            <li>
              <Link href="/royxatdan-otish" className="font-sans text-base text-mist underline-offset-4 hover:underline">
                Ro‘yxatdan o‘tish
              </Link>
            </li>
            <li>
              <Link href="/verify" className="font-sans text-base text-mist underline-offset-4 hover:underline">
                Sertifikatni tekshirish
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="font-sans text-base font-semibold text-deep-fg">Ijtimoiy tarmoqlar</h2>
          <p className="mt-3 font-mono text-base text-mist">@imkondigital</p>
          <p className="mt-1 font-sans text-base text-mist">Instagram · Telegram · YouTube</p>
        </div>
      </div>

      <div className="border-t border-deep-fg/10">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <p className="font-sans text-xs text-mist">© 2026 IMKON Digital · imkondigital.uz</p>
        </div>
      </div>
    </footer>
  );
}
