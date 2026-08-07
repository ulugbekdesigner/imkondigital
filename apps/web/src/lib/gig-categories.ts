/** Marketplace xizmat kategoriyalari — filtr chiplari va xizmat yaratish formasi uchun. */
export const GIG_CATEGORIES = ['Dizayn', 'Matn', 'Dasturlash', 'Ovoz'] as const;

export type GigCategory = (typeof GIG_CATEGORIES)[number];
