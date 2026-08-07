import type { Metadata, Viewport } from 'next';
import { Onest, Inter, JetBrains_Mono, Instrument_Serif } from 'next/font/google';
import { AccessibilityBar } from '@/components/accessibility-bar';
import { OfflineBanner } from '@/components/offline-banner';
import { ToastProvider } from '@/components/toast';
import { ZiyoWidget } from '@/components/ziyo-widget';
import './globals.css';

const display = Onest({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-mono',
  display: 'swap',
});

// Faqat bosh sahifa hero'sida bitta urg'u so'z uchun (italic serif aksent) —
// KENGAYISH landing dizayni.
const accent = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: 'italic',
  variable: '--font-accent',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://imkondigital.uz';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'IMKON Digital — inklyuziv raqamli karyera platformasi',
    template: '%s · IMKON Digital',
  },
  description: 'Raqamli kasb — chegarasiz imkoniyat. imkondigital.uz',
  icons: {
    icon: [
      { url: '/brand/favicon/imkon-favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/brand/favicon/imkon-favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/favicon/imkon-favicon-48.png', sizes: '48x48', type: 'image/png' },
    ],
    shortcut: '/brand/favicon/imkon-favicon-32.png',
    apple: '/brand/favicon/imkon-favicon-48.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#14171F',
  width: 'device-width',
  initialScale: 1,
};

/**
 * Gidratatsiyadan oldin rejimni o'rnatadi (FOUC yo'q).
 * Standart — "Oyna" yorug' brend qiyofasi (tizim moslamasi qanday bo'lishidan
 * qat'i nazar); foydalanuvchi AccessibilityBar orqali ochiq tanlasagina
 * "tun" yoki "kontrast" rejimiga o'tadi (localStorage'da saqlanadi).
 *
 * data-theme uchta qiymatdan biri: "oq" | "tun" | "kontrast" (2026-08-01dan
 * — avval data-theme="light"/"dark" + mustaqil data-contrast="normal"/"high"
 * ikki atribut edi, docs/design/README.md standartiga moslab bittaga birlashtirildi).
 * Eski localStorage qiymatlari (light/dark/high) bir martalik migratsiya
 * bilan yangi uchta qiymatga o'tkaziladi.
 */
const themeInitScript = `
(function () {
  try {
    var d = document.documentElement;
    var stored = localStorage.getItem('imkon-theme');
    var oldContrast = localStorage.getItem('imkon-contrast');
    var theme = 'oq';
    if (oldContrast === 'high') {
      theme = 'kontrast';
    } else if (stored === 'tun' || stored === 'kontrast' || stored === 'oq') {
      theme = stored;
    } else if (stored === 'dark') {
      theme = 'tun';
    } else if (stored === 'light') {
      theme = 'oq';
    }
    d.setAttribute('data-theme', theme);
    d.setAttribute('data-font-scale', localStorage.getItem('imkon-font-scale') || 'md');
    d.setAttribute('data-motion', localStorage.getItem('imkon-motion') || 'normal');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="uz"
      className={`${display.variable} ${sans.variable} ${mono.variable} ${accent.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans">
        <a href="#main" className="skip-link bg-primary text-primary-fg rounded px-4 py-2">
          Asosiy mazmunga o'tish
        </a>
        <ToastProvider>
          <AccessibilityBar />
          <OfflineBanner />
          <main id="main">{children}</main>
          <ZiyoWidget />
        </ToastProvider>
      </body>
    </html>
  );
}
