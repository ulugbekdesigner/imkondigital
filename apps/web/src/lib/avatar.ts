/** Ism-familiyadan bosh harflar ("Dilnoza Karimova" → "DK") — gradient
 * avatar doiralarida rasm o'rniga ishlatiladi (rasm maydoni yo'q joylarda). */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (!first) return '?';
  const second = parts[1];
  return second ? (first.charAt(0) + second.charAt(0)).toUpperCase() : first.slice(0, 2).toUpperCase();
}

/** Ro'yxatlarda qatorlar orasida vizual xilma-xillik uchun — faqat token
 * ranglaridan (CONTRIBUTING.md 4-qoida), id bo'yicha barqaror (tasodifiy emas,
 * server/klient bir xil natija berishi kerak). */
const AVATAR_GRADIENTS = [
  'linear-gradient(140deg, rgb(var(--imkon-teal)), rgb(var(--imkon-bright)))',
  'linear-gradient(140deg, var(--step-1), rgb(var(--imkon-bright)))',
  'linear-gradient(140deg, var(--step-0), var(--step-2))',
];

export function avatarGradient(id: number): string {
  return (
    AVATAR_GRADIENTS[id % AVATAR_GRADIENTS.length] ??
    'linear-gradient(140deg, rgb(var(--imkon-teal)), rgb(var(--imkon-bright)))'
  );
}
