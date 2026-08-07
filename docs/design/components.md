# IMKON Digital â komponentlar va patternlar

Barcha kod **React (Next.js App Router)** uchun yozilgan, lekin CSS toza â Vue/Astro/Django'da ham
o'zgarishsiz ishlaydi. Faqat `tokens.css` + `ui.css` import qilinadi, Tailwind shart emas.

```
app/
  globals.css        â  @import 'design/tokens.css'; @import 'design/ui.css';
  layout.tsx         â  <html lang="uz"> + font <link> lar
  page.tsx           â  Landing (Hero, Bento, Stories, Donate, Footer)
  kabinet/page.tsx   â  boshqa bo'limlar shu patternlarni qayta ishlatadi
components/
  ui/Section.tsx  ui/Card.tsx  ui/Glass.tsx  ui/Button.tsx  ui/Chip.tsx  ui/Progress.tsx
  ornament/Star.tsx  ornament/Lattice.tsx  ornament/Seam.tsx  ornament/Arch.tsx
  ziyo/ZiyoWidget.tsx
hooks/
  useCursorGlow.ts  useParallaxBlobs.ts  useReveal.ts
```

Shriftlar (`app/layout.tsx` yoki `<head>`):

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap" />
```

---

## 1. Section â har bir bo'limning qobig'i

```tsx
type Tone = 'dark' | 'light' | 'brand';

export function Section({ tone = 'dark', reveal = true, children, className = '' }:
  { tone?: Tone; reveal?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <section
      data-reveal={reveal ? '1' : undefined}
      className={`imk-section imk-section--${tone} ${className}`}
    >
      {children}
    </section>
  );
}
```

Qoidalar:
- Bir sahifada **maksimum 2 ta fon rangi** ketma-ket almashadi: `dark â light â dark â brand â dark`.
- Bo'limlar bir-biriga *erimaydi* â har biri o'z chegarasi bilan, faqat scroll-animatsiya bilan chiqadi.
- Ikki bo'limni bog'lash kerak bo'lsa â `Seam` yoki `Arch` (crown + legs) ishlatiladi, gradient bilan emas.

## 2. Card â barcha bo'limlarda bir xil

```tsx
export function Card({ label, title, children, footer }: {
  label?: string; title?: string; children?: React.ReactNode; footer?: React.ReactNode;
}) {
  return (
    <article className="imk-card">
      {label && <span className="imk-card__label">{label}</span>}
      {title && <h3 className="imk-card__title">{title}</h3>}
      {children && <p className="imk-card__body">{children}</p>}
      {footer && <div style={{ marginTop: 'auto' }}>{footer}</div>}
    </article>
  );
}
```

- Hover: 7px ko'tarilish + feruza kontur glow (`--sh-hover`) â CSS'da, JS kerak emas.
- Bento tarmoq: `display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px;`
  kartalar `grid-column: span 3 | 2` bilan turli o'lchamda.
- Oq fon ustida karta kerak bo'lsa ham **quyuq karta** ishlatiladi (kontrast shu tizimning imzosi).

## 3. Glass â faqat gradient/rasm ustida

```tsx
export const Glass = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) =>
  <div className="imk-glass glass" style={style}>{children}</div>;
```

Cheklov: shisha panel **ichidagi matn** har doim â¥ 4.5:1 â shuning uchun fon sifatida
`rgba(16,26,51,.5â.9)` qatlam qo'shiladi, sof shaffof oq emas.

## 4. useCursorGlow â kursor ortidan yuruvchi nur

Har bo'limga bitta `<div className="imk-glow imk-glow--dark" />` qo'yiladi (bo'limning birinchi bolasi),
hook uni harakatlantiradi.

```ts
export function useCursorGlow() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const state = { x: 0, y: 0, seen: false, pos: new WeakMap<Element, {x:number;y:number}>() };
    const onMove = (e: MouseEvent) => { state.x = e.clientX; state.y = e.clientY; state.seen = true; };
    let raf = 0;
    const tick = () => {
      if (state.seen) {
        document.querySelectorAll<HTMLElement>('.imk-glow').forEach((glow) => {
          const host = glow.parentElement!.getBoundingClientRect();
          const tx = state.x - host.left, ty = state.y - host.top;
          const p = state.pos.get(glow) ?? { x: tx, y: ty };
          p.x += (tx - p.x) * 0.12;                     // lerp = silliqlik
          p.y += (ty - p.y) * 0.12;
          state.pos.set(glow, p);
          glow.style.translate = `${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`;
          const inside = state.x >= host.left && state.x <= host.right &&
                         state.y >= host.top  && state.y <= host.bottom;
          glow.style.opacity = inside ? '1' : '0';
        });
      }
      raf = requestAnimationFrame(tick);
    };
    addEventListener('mousemove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); removeEventListener('mousemove', onMove); };
  }, []);
}
```

## 5. useParallaxBlobs â fon gradientlari kursor va scroll bilan

Bloblar: `<div className="imk-blob" data-depth="1" style={{...}} />`, 2â3 dona quyuq bo'limda.

```ts
export function useParallaxBlobs() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = { mx: 0, my: 0, cx: 0, cy: 0, sy: 0, csy: 0 };
    const onMove = (e: MouseEvent) => {
      t.mx = (e.clientX / innerWidth - 0.5) * 2;
      t.my = (e.clientY / innerHeight - 0.5) * 2;
    };
    const onScroll = () => { t.sy = scrollY; };
    let raf = 0;
    const tick = () => {
      t.cx += (t.mx - t.cx) * 0.055;
      t.cy += (t.my - t.cy) * 0.055;
      t.csy += (t.sy - t.csy) * 0.08;
      document.querySelectorAll<HTMLElement>('[data-depth]').forEach((el) => {
        const d = Number(el.dataset.depth) || 1;
        const k = 70 + d * 38;                          // chuqurlik = turlicha tezlik
        el.style.translate =
          `${(t.cx * k).toFixed(1)}px ${(t.cy * k * 0.65 - t.csy * 0.07 * d).toFixed(1)}px`;
      });
      raf = requestAnimationFrame(tick);
    };
    addEventListener('mousemove', onMove, { passive: true });
    addEventListener('scroll', onScroll, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); removeEventListener('mousemove', onMove); removeEventListener('scroll', onScroll); };
  }, []);
}
```

## 6. useReveal â bo'limlar scroll bilan chiqishi

```ts
export function useReveal() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    els.forEach((el) => {
      el.style.transition = 'opacity 900ms cubic-bezier(.2,.7,.2,1), translate 900ms cubic-bezier(.2,.7,.2,1)';
      el.style.opacity = '0';
      el.style.translate = '0 36px';
    });
    const show = (el: HTMLElement) => { el.style.opacity = '1'; el.style.translate = '0 0'; };
    const check = () => {
      els.forEach((el) => {
        if (el.style.opacity === '1') return;
        const r = el.getBoundingClientRect();
        if (r.top < innerHeight * 0.88 && r.bottom > innerHeight * 0.06) show(el);
      });
      const de = document.documentElement;
      if (scrollY + innerHeight >= de.scrollHeight - 8) els.forEach(show);   // oxirga yetganda hammasi
    };
    const armed = setTimeout(() => { requestAnimationFrame(() => requestAnimationFrame(check)); }, 450);
    addEventListener('scroll', check, { passive: true });
    addEventListener('resize', check, { passive: true });
    return () => { clearTimeout(armed); removeEventListener('scroll', check); removeEventListener('resize', check); };
  }, []);
}
```

> Muhim: birinchi tekshiruv **layout o'rnashgach** (â450ms) ishga tushadi â aks holda hamma bo'lim
> bir vaqtda "ochilib" qoladi.

## 7. ZiyoWidget â doimiy AI yordamchi

Har sahifada bitta, `position: fixed; right: 26px; bottom: 26px; z-index: 60`.

```tsx
const ANSWERS = {
  kurs:    'Imkoniyat xaritangizga qarab "Frontend asoslari" kursini tavsiya qilamanâ¦',
  ish:     'Bugun 3 ta mos vakansiya topdimâ¦',
  rezyume: 'Rezyumengizni "Junior Frontend" talablariga moslashtirdimâ¦',
} as const;

export function ZiyoWidget() {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<keyof typeof ANSWERS>('ish');
  return (
    <div className="imk-ziyo">
      {open && (
        <div className="imk-ziyo__panel glass" role="dialog" aria-label="ZIYO AI yordamchisi">
          <header>ZIYO <span>Onlayn Â· yordamga tayyor</span>
            <button onClick={() => setOpen(false)} aria-label="Yopish">â</button></header>
          <p>{ANSWERS[topic]}</p>
          <div className="imk-ziyo__chips">
            {(['kurs','ish','rezyume'] as const).map((k) => (
              <button key={k} className={`imk-chip ${topic === k ? 'imk-chip--active' : ''}`}
                      onClick={() => setTopic(k)}>{k}</button>
            ))}
          </div>
          <input placeholder="Savolingizni yozing yoki aytingâ¦" aria-label="ZIYO'ga savol" />
        </div>
      )}
      <button className="imk-ziyo__pill" onClick={() => setOpen(v => !v)} aria-expanded={open}>
        <ZiyoRobot />  {/* 48px, ko'z: blink 6s, halo: 3.6s, korpus: bob 5s */}
        <span>ZIYO bilan gaplashish<small>AI yordamchi Â· o'zbek tilida</small></span>
      </button>
    </div>
  );
}
```

Robot â rasm emas, **div'lardan**: 48px `border-radius: 17px`, korpus `linear-gradient(150deg,#f9f7f2,#cfd9e6)`,
ekran `#101a33` + ikkita `#6fb3cf` ko'z (`animation: blink 6s`), tepada antenna nuqtasi, orqada `halo` gradient.
Backend ulanganda `ANSWERS` o'rniga streaming javob keladi â UI o'zgarmaydi, `typing` keyframe ishlatiladi.

---

## 8. Boshqa bo'limlar uchun tayyor retseptlar

Hammasi bir xil primitivlardan yig'iladi â yangi rang yoki yangi radius **kiritilmaydi**.

| Bo'lim | Fon | Tarkib |
|---|---|---|
| **Kabinet (dashboard)** | `dark` | Yuqorida salomlashuv + 3 ta `imk-glass` KPI (progress, vakansiya, mentor). Pastda 6-ustunli bento: kurs davomi (span 3), tavsiya etilgan vakansiyalar (span 3), ko'nikma grafigi (span 2), portfolio (span 2), qulaylik sozlamalari (span 2). |
| **Kurslar katalogi** | `light` | Filtrlar `imk-chip` qatori; kartalar 3 ustun `imk-card`, har birida label (daraja Â· davomiylik), title, body, pastda progress yoki "Bepul" chip. |
| **Kurs sahifasi** | `dark` | Chapda video/darslar ro'yxati (`imk-card__row` ketma-ketligi), o'ngda yopishqoq `imk-glass`: progress, keyingi dars, ZIYO maslahati. |
| **Vakansiyalar** | `light` | Yuqorida qidiruv `imk-glass`; ro'yxat `imk-card` (kompaniya avatari 56px, "92% mos" chip, moslashtirilgan sharoit teglari). |
| **Portfolio** | `dark` | Bento: 2 ta katta loyiha (span 3), 3 ta kichik (span 2); rasm o'rni `linear-gradient(140deg, rgba(143,200,230,.4), rgba(143,200,230,.08))`. |
| **Ish beruvchi kabineti** | `light` | Jadval o'rniga kartalar; status chiplari: `--brand-500` (faol), `--teal-400` (ko'rib chiqilmoqda), kul rang (yopilgan). |
| **Xayriya** | `brand` | `imk-glass` ichida summa + `imk-progress` + CTA; yuqori qirrada `Seam`, pastda `Arch crown` â footerda `Arch legs`. |
| **Profil / Sozlamalar** | `dark` | Ikki ustun: chapda bo'limlar ro'yxati, o'ngda `imk-card` ichida toggle qatorlari (qulaylik rejimi shu yerda boshqariladi). |

Har bir sahifa boshida: `useCursorGlow()`, `useReveal()`, quyuq bo'limlarda qo'shimcha `useParallaxBlobs()`.

## 9. O'zgarmas qoidalar (design contract)

1. Bitta aksent oila â ko'k (`--brand-*`) + uning jimroq ukasi feruza (`--teal-*`). Yashil/qizil faqat status uchun.
2. Sarlavhada **bitta** italik serif so'z (`--font-accent`), qolgani Onest.
3. Radius: karta 24, panel 22, ichki qator 14, tugma 999.
4. Animatsiya: kirish 900ms, hover 460ms, `cubic-bezier(.2,.7,.2,1)`. Tez miltillash yo'q.
5. Naqsh â har bo'limda **bitta** motiv, shaffoflik â¤ 0.16, hech qachon matn ortida qalin emas.
6. `prefers-reduced-motion` va `prefers-reduced-transparency` â majburiy fallback.
7. Matn kontrasti: quyuq fonda `#c9d6e6` dan ochroq, oq fonda `#3f4a5c` dan quyuqroq.
