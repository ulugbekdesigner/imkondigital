/** Kurslar taksonomiyasi (Vision Book 3.3) — Narvon pog'onasiga bog'langan. */

export interface CourseCategory {
  key: string;
  title: string;
  examples: string[];
  step: 0 | 1 | 2 | 3 | 4;
}

export const COURSE_CATEGORIES: CourseCategory[] = [
  {
    key: 'A',
    title: 'Hunarmandchilik va qo‘l mehnati',
    examples: ['Tikuvchilik va bichish', 'Kashtachilik va to‘qish', 'Zargarlik va kulolchilik'],
    step: 1,
  },
  {
    key: 'B',
    title: 'Oziq-ovqat va xizmat',
    examples: ['Pazandachilik', 'Shirinliklar va tort', 'Tandir biznesi asoslari'],
    step: 1,
  },
  {
    key: 'C',
    title: 'Qishloq xo‘jaligi va uy xo‘jaligi',
    examples: ['Issiqxona dehqonchiligi', 'Parrandachilik', 'Ko‘chat yetishtirish'],
    step: 1,
  },
  {
    key: 'D',
    title: 'Texnik va ta‘mirlash ishlari',
    examples: ['Telefon va texnika ta‘miri', 'Elektr montaj asoslari', 'Santexnika'],
    step: 1,
  },
  {
    key: 'E',
    title: 'Ofis va masofaviy ishlar',
    examples: ['Kompyuter savodxonligi', 'Data entry va transkripsiya', 'Buxgalteriya (1C, Excel)'],
    step: 1,
  },
  {
    key: 'F',
    title: 'Ijodiy va raqamli kasblar',
    examples: ['Grafik dizayn va SMM', 'Video montaj', 'Kopiraytin va tarjimonlik'],
    step: 2,
  },
  {
    key: 'G',
    title: 'IT (yuqori daraja)',
    examples: ['Veb-dasturlash', 'Mobil ilovalar', 'Data tahlil va QA'],
    step: 3,
  },
  {
    key: 'H',
    title: 'Tadbirkorlik va soft skills',
    examples: ['Kichik biznes ro‘yxati', 'Narx belgilash', 'Shaxsiy moliya'],
    step: 4,
  },
  {
    key: 'I',
    title: 'Til o‘rganish',
    examples: ['Ingliz tili — ish uchun', 'Rus tili — mijozlar bilan', 'Nemis tili asoslari'],
    step: 2,
  },
];
