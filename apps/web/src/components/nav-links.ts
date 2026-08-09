export interface NavLink {
  href: string;
  label: string;
}

export const NAV_LINKS: NavLink[] = [
  { href: '/kurslar', label: 'Kurslar' },
  { href: '/vakansiyalar', label: 'Vakansiyalar' },
  { href: '/xalqaro-ishlar', label: 'Xalqaro ishlar' },
  { href: '/gigs', label: 'Xizmatlar' },
  { href: '/xizmatlar', label: 'B2B xizmatlar' },
  { href: '/imtiyozlar', label: 'Imtiyozlar' },
  { href: '/hududlar', label: 'Hududlar' },
  { href: '/ish-beruvchilarga', label: 'Ish beruvchilarga' },
  { href: '/donorlarga', label: 'Donorlarga' },
  { href: '/xayriya', label: 'Xayriya' },
  { href: '/tariflar', label: 'Tariflar' },
  { href: '/ruhiy-kuch', label: "Ruhiy qo'llab-quvvatlash" },
  { href: '/haqida', label: 'Haqida' },
  { href: '/aloqa', label: 'Aloqa' },
];

/**
 * Desktop header'da to'g'ridan-to'g'ri ko'rinadigan bo'limlar (asosiy audauditoriya —
 * ish/kasb qidiruvchi uchun eng muhim 5tasi). Qolganlari "Ko'proq" ochiladigan
 * menyusida — 9-11 ta yassi bo'limni bitta qatorga sig'dirishga urinish o'rniga
 * (bu matn ikki qatorga bukilib ketishiga sabab bo'lgan edi).
 */
export const NAV_PRIMARY_HREFS: string[] = [
  '/kurslar',
  '/vakansiyalar',
  '/xalqaro-ishlar',
  '/gigs',
  '/imtiyozlar',
];
