/**
 * IMKON Digital — "Firuza" Design System 2.0 · Tailwind preset
 *
 * Ranglar CSS o'zgaruvchilariga (var(--...)) bog'langan. Bu:
 *   - oq / tun / kontrast rejimlarini runtime'da almashtirishga imkon beradi
 *     (bitta data-theme atributi orqali — 2026-08-01: avvalgi data-theme+
 *     data-contrast ikki atributi birlashtirildi),
 *   - inline rang taqiqini kuchaytiradi (CONTRIBUTING.md 4-qoida).
 *
 * Xom hex qiymatlar apps/web/src/app/globals.css da e'lon qilinadi.
 * `dark:` Tailwind varianti "tun" VA "kontrast" ikkalasida ham ishlaydi —
 * ikkalasi ham qora/quyuq fon asosida (kontrast — AAA, tun — oddiy qorong'i).
 */

/** @type {import('tailwindcss').Config} */
const preset = {
  darkMode: ['selector', ':is([data-theme="tun"], [data-theme="kontrast"])'],
  theme: {
    extend: {
      // DIQQAT: 8 ta token (deep/deep-fg/bright/teal/mint/gold/ink/error)
      // qiymati globals.css'da "R G B" (bo'shliq bilan) formatida saqlanadi
      // (xom hex EMAS) — shu sabab bu yerda rgb(var(--x) / <alpha-value>)
      // bilan o'ralgan, aks holda bg-mint/40 kabi opacity-modifikatorlar
      // (Tailwind'ga xos <alpha-value> almashtirish sintaksisi) yaroqsiz
      // qiymat berardi (ko'rinmas matn/fon — butun ilovada ~90 joyda topilgan
      // xato). Boshqa tokenlar (paper, ink-soft, line va h.k.) opacity bilan
      // ishlatilmaydi — xom var() yetarli.
      colors: {
        // Brend
        deep: {
          DEFAULT: 'rgb(var(--imkon-deep) / <alpha-value>)',
          fg: 'rgb(var(--imkon-deep-fg) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'var(--imkon-primary)',
          fg: 'var(--imkon-primary-fg)',
        },
        bright: 'rgb(var(--imkon-bright) / <alpha-value>)',
        teal: 'rgb(var(--imkon-teal) / <alpha-value>)',
        mint: 'rgb(var(--imkon-mint) / <alpha-value>)',
        'surface-2': 'var(--surface-2)',
        mist: 'var(--imkon-mist)',
        // Milliy mikro-detal aksentlari (V2 A3-bo'lim)
        gold: {
          DEFAULT: 'rgb(var(--imkon-gold) / <alpha-value>)',
          fg: 'var(--imkon-gold-fg)',
        },
        coral: 'var(--imkon-coral)',
        // Neytral
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          soft: 'var(--ink-soft)',
        },
        paper: 'var(--paper)',
        line: 'var(--line)',
        // Semantik — matn/tugma rangi; -bg — faqat belgi (Badge) yumshoq foni
        warn: { DEFAULT: 'var(--warn)', bg: 'var(--warn-bg)' },
        error: {
          DEFAULT: 'rgb(var(--error) / <alpha-value>)',
          fg: 'var(--error-fg)',
          bg: 'var(--error-bg)',
        },
        info: { DEFAULT: 'var(--info)', bg: 'var(--info-bg)' },
        success: {
          DEFAULT: 'var(--success)',
          fg: 'var(--success-fg)',
          bg: 'var(--success-bg)',
        },
        // Narvon pog'onalari 0→4
        step: {
          0: 'var(--step-0)',
          1: 'var(--step-1)',
          2: 'var(--step-2)',
          3: 'var(--step-3)',
          4: 'var(--step-4)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Type scale: 14 / 16 / 18 / 22 / 28 / 36 / 52 (2.3-bo'lim)
        xs: ['0.875rem', { lineHeight: '1.5' }], // 14
        base: ['1rem', { lineHeight: '1.6' }], // 16
        md: ['1.125rem', { lineHeight: '1.6' }], // 18
        lg: ['1.375rem', { lineHeight: '1.4' }], // 22
        xl: ['1.75rem', { lineHeight: '1.3' }], // 28
        '2xl': ['2.25rem', { lineHeight: '1.2' }], // 36
        '3xl': ['3.25rem', { lineHeight: '1.1' }], // 52
        // V2 A4: hero sarlavha — kattaroq, yengilroq, siqilgan harf oralig'i
        hero: ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }], // 56
      },
      borderRadius: {
        sm: '0.375rem',
        DEFAULT: '0.625rem',
        lg: '1rem',
        xl: '1.5rem',
      },
      ringColor: {
        // DIQQAT (yuqoridagi izohga qarang): --imkon-bright "R G B" formatida
        // saqlanadi, xom var() emas — shu sabab rgb(...) bilan o'ralishi
        // shart, aks holda --tw-ring-color yaroqsiz qiymatga ega bo'ladi va
        // butun box-shadow deklaratsiyasi (fokus halqasi) BUTUN ILOVADA
        // ko'rinmas bo'lib qoladi (klaviatura fokusi butunlay yo'qoladi —
        // CONTRIBUTING.md 3-qoida buzilishi).
        focus: 'rgb(var(--imkon-bright) / <alpha-value>)',
      },
      ringOffsetWidth: {
        focus: '2px',
      },
      minHeight: {
        touch: '2.75rem', // 44px — WCAG 2.2 touch target
      },
      minWidth: {
        touch: '2.75rem',
      },
      // Shisha (glass) qatlami — Glassmorphism 4.0 "Oyna": nozik, neytral
      // soya + oq sirt — "window/glass panel" tuyg'usi (foydalanuvchi
      // ko'rsatgan namuna: Caregivez megamenu, dribbble.com/shots/26964007)
      boxShadow: {
        glass: '0 12px 32px -12px rgb(15 23 42 / 0.14)',
        glow: '0 0 40px -14px var(--imkon-bright)',
        'glow-gold': '0 0 40px -14px var(--imkon-gold)',
        // IMKON Interface.dc.html 4a-blok ("Ko'tarilish") — sm/md/lg zinapoyasi,
        // ink-rangli (16,32,60) soya. lg — modal/drawer uchun.
        'card-sm': '0 1px 2px rgba(16,32,60,0.10)',
        'card-md': '0 8px 22px rgba(16,32,60,0.10)',
        'card-lg': '0 18px 44px rgba(16,32,60,0.16)',
      },
      // Animatsiya tokenlari (V2 A5-bo'lim) — globals.css'dagi
      // prefers-reduced-motion qoidasi bularni ham qamrab oladi
      transitionDuration: {
        fast: 'var(--motion-fast)',
        DEFAULT: 'var(--motion-base)',
        slow: 'var(--motion-slow)',
      },
      transitionTimingFunction: {
        DEFAULT: 'var(--motion-ease)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(3%, -4%) scale(1.05)' },
        },
        // Harakat tizimi (5b-blok) — tabrik ekranlari uchun. Barchasi BIR MARTA
        // ishlaydi (infinite emas) va 2.2s ichida to'xtaydi (miltillash yo'q,
        // fotosezgir xavfsiz).
        riseSlow: {
          '0%': { transform: 'translateY(0)', opacity: '0' },
          '15%': { opacity: '1' },
          '100%': { transform: 'translateY(-52px)', opacity: '0' },
        },
        checkPop: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '60%': { transform: 'scale(1.12)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        floatSoft: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        ringPulse: {
          '0%': { transform: 'scale(1)', opacity: '0.55' },
          '100%': { transform: 'scale(1.7)', opacity: '0' },
        },
        // Harakat tizimi (5b-blok) — o'tkinchi bildirishnoma (toast) uchun.
        toastIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        dotPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.35)', opacity: '0.7' },
        },
        fadeUp: {
          '0%': { transform: 'translateY(6px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        // Bir martalik "yaltiroq" o'tish chizig'i — quyuq toast karta va
        // progress-bar to'ldirilishida (konteyner kengligidan qat'i nazar
        // ishlashi uchun `left` foiz bilan animatsiya qilinadi).
        sweep: {
          '0%': { left: '-40%' },
          '100%': { left: '120%' },
        },
      },
      animation: {
        // Skeleton yuklanish effekti (A5-bo'lim) — motion-reduce:animate-none bilan
        // birga ishlatiladi, global prefers-reduced-motion qoidasi ham qamrab oladi
        shimmer: 'shimmer 1.6s infinite',
        // Gradient-mesh foni uchun juda sekin, nozik "suzish" — motion-reduce:animate-none
        float: 'float 18s ease-in-out infinite',
        'rise-slow': 'riseSlow 2.2s ease-out forwards',
        'check-pop': 'checkPop 460ms cubic-bezier(0.2, 0.9, 0.3, 1.2) forwards',
        'float-soft': 'floatSoft 2200ms ease-in-out 1 both',
        'ring-pulse': 'ringPulse 1.1s ease-out 2',
        'toast-in': 'toastIn 420ms cubic-bezier(0.2, 0.7, 0.2, 1) forwards',
        'dot-pulse': 'dotPulse 2.4s ease-in-out infinite',
        'fade-up': 'fadeUp 500ms ease-out forwards',
        sweep: 'sweep 1.6s ease-in-out 1 forwards',
      },
    },
  },
  plugins: [],
};

export default preset;
