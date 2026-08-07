/**
 * Sana formatlash — natija HAR DOIM Toshkent vaqt zonasida VA aniq
 * belgilangan shaklda ("DD.MM.YYYY", "DD.MM.YYYY HH:MM") chiqadi.
 *
 * `toLocaleString`/`toLocaleDateString`'ning "standart" (locale-default)
 * shaklidan ATAYLAB foydalanilmaydi — Node (server) va brauzer (klient)
 * ICU'si bir xil 'uz-UZ' locale uchun ham TURLI maydon tartibida
 * (masalan server "27/07/2026", klient "2026-07-27") chiqarishi mumkin,
 * bu esa "use client" komponentlarda React hydration xatosiga olib
 * keladi (cv-builder-panel.tsx'da aynan shu xato topilgan va tuzatilgan).
 * `formatToParts` bilan faqat RAQAM qismlarini (Asia/Tashkent bo'yicha,
 * bu qism ICU'lar orasida barqaror) olib, satrni o'zimiz yig'amiz —
 * natija qaysi muhitda ishlashidan qat'i nazar bir xil bo'ladi.
 */
const PARTS_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Tashkent',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function parts(iso: string) {
  const map: Record<string, string> = {};
  for (const p of PARTS_FORMATTER.formatToParts(new Date(iso))) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }
  return map;
}

export function formatDate(iso: string): string {
  const p = parts(iso);
  return `${p.day}.${p.month}.${p.year}`;
}

export function formatDateTime(iso: string): string {
  const p = parts(iso);
  return `${p.day}.${p.month}.${p.year} ${p.hour}:${p.minute}:${p.second}`;
}

/**
 * Mingliklarni bo'shliq bilan ajratadi ("12 428") — `toLocaleString('uz-UZ')`
 * ATAYLAB ishlatilmaydi: xuddi shu server/klient ICU nomuvofiqligi (yuqoridagi
 * izohga qarang) raqam guruhlash uchun ham chiqishi mumkin (server " ",
 * klient ",") — sof satr amali orqali bundan butunlay xoli.
 */
export function formatThousands(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Nisbiy vaqt ("2 soat oldin", "kecha") — faqat server komponentida
 * chaqiriladi (hech qachon 'use client'da), aks holda server render vaqti
 * bilan mijoz gidratatsiya vaqti orasidagi farq natijani mos kelmasligiga
 * olib kelishi mumkin (bu fayldagi boshqa funksiyalarni shu sabab keltirib
 * chiqargan xatoga o'xshash — server komponentlar qayta ijro etilmagani
 * uchun bu yerda muammo yo'q).
 */
/**
 * Navbatdagi elementlarning o'rtacha kutish muddati (kun, bitta o'nlik
 * xona bilan) — IMKON Interface.dc.html 4i-blok ("o'rtacha kutish 1.2 kun").
 * Faqat server komponentida chaqiriladi (formatRelativeTime'dagi kabi sabab
 * bilan) — `submitted_at` ro'yxati bo'sh bo'lsa `null` (bo'sh navbatda
 * o'rtacha kutish tushunchasi yo'q).
 */
export function averageWaitDays(submittedAtList: string[]): number | null {
  if (submittedAtList.length === 0) return null;
  const now = Date.now();
  const totalDays = submittedAtList.reduce(
    (sum, iso) => sum + (now - new Date(iso).getTime()) / 86_400_000,
    0,
  );
  return totalDays / submittedAtList.length;
}

export function formatRelativeTime(iso: string): string {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return 'hozirgina';
  if (diffMin < 60) return `${diffMin} daqiqa oldin`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} soat oldin`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return 'kecha';
  if (diffDay < 7) return `${diffDay} kun oldin`;
  return formatDate(iso);
}
