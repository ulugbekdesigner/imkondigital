import Link from 'next/link';

/* ============================================================
   IMKON DIGITAL — Kirish/Ro'yxatdan o'tish chap brend paneli
   (IMKON Interface.dc.html 4c-blok, "Kirish · Ro'yxatdan o'tish").
   Ikkala auth route (/kirish, /royxatdan-otish) BIR XIL spec blokka
   tegishli — shu sabab panel bitta umumiy komponentga chiqarilgan.
   ============================================================ */
const ACCESS_BADGES = ["Ekran o'quvchi", 'Klaviatura', 'Subtitr'];

export function AuthBrandPanel() {
  return (
    <div className="relative isolate hidden flex-col justify-between overflow-hidden bg-deep p-12 lg:flex">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 -top-16 h-[380px] w-[380px] rounded-full blur-[50px]"
        style={{ background: 'radial-gradient(circle, rgb(var(--imkon-bright) / 0.85), rgb(var(--imkon-bright) / 0))' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -right-24 h-[340px] w-[340px] rounded-full blur-[50px]"
        style={{ background: 'radial-gradient(circle, rgb(var(--imkon-teal) / 0.6), rgb(var(--imkon-teal) / 0))' }}
      />

      <Link href="/" className="relative flex items-center gap-2.5">
        <img src="/brand/imkon-mark-white.svg" alt="" aria-hidden="true" width={30} height={30} className="h-[30px] w-[30px] shrink-0" />
        <span className="font-display text-lg font-bold tracking-tight text-deep-fg">IMKON</span>
      </Link>

      <div className="relative flex flex-col gap-3.5">
        <h2 className="max-w-md font-display text-3xl font-bold leading-[1.15] tracking-tight text-deep-fg">
          Kasbdan ishga — bitta hisob bilan
        </h2>
        <p className="max-w-sm font-sans text-base leading-relaxed text-mist">
          Kurslar, portfolio, vakansiyalar va ZIYO yordamchisi bitta profilda saqlanadi.
        </p>
        <ul className="mt-1 flex flex-wrap gap-2" aria-label="Qulaylik imkoniyatlari">
          {ACCESS_BADGES.map((b) => (
            <li
              key={b}
              className="rounded-full border border-deep-fg/20 bg-deep-fg/10 px-[13px] py-[7px] font-sans text-xs font-semibold text-deep-fg/90"
            >
              {b}
            </li>
          ))}
        </ul>
      </div>

      <p className="relative font-sans text-xs text-mist">imkondigital.uz</p>
    </div>
  );
}
