/**
 * Vacancy.accommodations — backendda erkin JSONB kalit-qiymat, sobit ro'yxat
 * talab qilmaydi. Bu 4 tasi ish beruvchi yaratish formasi uchun tanlangan
 * kanonik to'plam — create-vacancy-form.tsx shu kalitlarni yozadi,
 * vakansiya detal sahifasi shu labellarni o'qiydi (bitta manba).
 */
export const ACCOMMODATION_OPTIONS: { key: string; label: string }[] = [
  { key: 'flexible_schedule', label: 'Moslashuvchan jadval' },
  { key: 'equipment', label: "Texnika ta'minoti" },
  { key: 'sign_language_interpreter', label: 'Imo-ishora tarjimoni' },
  { key: 'wheelchair_access', label: 'Nogironlar aravachasi uchun ofis' },
];

const LABEL_BY_KEY: Record<string, string> = Object.fromEntries(
  ACCOMMODATION_OPTIONS.map((o) => [o.key, o.label]),
);

/** Kanonik kalit uchun aniq label, aks holda kalitdan taxminiy matn yasaydi. */
export function accommodationLabel(key: string): string {
  if (LABEL_BY_KEY[key]) return LABEL_BY_KEY[key];
  const spaced = key.replace(/[_-]+/g, ' ').trim();
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : key;
}
