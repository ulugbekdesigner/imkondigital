/** Raqamli Narvon — 5 pog'ona (0→4). Vision Book "Raqamli Narvon" modeli. */

export interface NarvonRung {
  step: 0 | 1 | 2 | 3 | 4;
  title: string;
  duration: string;
  professions: string[];
  income: string;
}

export const NARVON: NarvonRung[] = [
  {
    step: 0,
    title: 'Raqamli savodxonlik',
    duration: '2–4 hafta',
    professions: ['Kompyuter va smartfon', 'Internet va xavfsizlik', 'Telegram va Google vositalari'],
    income: 'Hali daromad yo‘q — lekin eshik ochiladi',
  },
  {
    step: 1,
    title: 'Raqamli yordamchi kasblar',
    duration: '1–2 oy',
    professions: ['Data entry va matn terish', 'Transkripsiya', 'Onlayn operator', 'E-commerce kartochkalari'],
    income: 'Birinchi daromad 1–2 oyda',
  },
  {
    step: 2,
    title: 'Raqamli mutaxassisliklar',
    duration: '3–6 oy',
    professions: ['SMM va targeting', 'Grafik dizayn', 'Kontent va kopiraytin', 'Video montaj', 'Buxgalteriya (1C, Excel)'],
    income: 'Barqaror oylik va doimiy mijozlar',
  },
  {
    step: 3,
    title: 'Yuqori IT kasblar',
    duration: '6–18 oy',
    professions: ['Veb-dasturlash', 'Mobil ilovalar', 'QA testing', 'Data tahlil', 'UX/UI dizayn'],
    income: 'Bozordagi eng yuqori maoshlar, xalqaro loyihalar',
  },
  {
    step: 4,
    title: 'Raqamli tadbirkorlik',
    duration: 'Cho‘qqi',
    professions: ['O‘z agentligingiz', 'O‘z mahsulotingiz', 'Jamoa yig‘ish', 'IMKON’da ustozlik'],
    income: 'O‘z biznesingiz — va boshqalarga yo‘l ochasiz',
  },
];
