import type { Metadata } from 'next';
import Link from 'next/link';
import { API_INTERNAL_URL } from '@/lib/api-config';
import { LandingSection, CursorGlow } from '@/components/landing/primitives';
import { CheckIcon, AlertIcon } from '@/components/shell-icons';
import { ShareButton } from '@/components/share-button';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Sertifikat natijasi',
  description: 'IMKON Digital sertifikatini tekshirish natijasi.',
  robots: { index: false },
};

interface VerifiedCert {
  uid: string;
  full_name: string;
  course_id: number | null;
  course_title: string | null;
  issued_at: string;
  qr_url: string | null;
  pdf_url: string | null;
}

async function lookup(uid: string): Promise<VerifiedCert | null> {
  const res = await fetch(`${API_INTERNAL_URL}/v1/verify/${encodeURIComponent(uid)}`, {
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as VerifiedCert;
}

export default async function VerifyResultPage({ params }: { params: { uid: string } }) {
  const cert = await lookup(params.uid);

  return (
    <LandingSection tone="dark" ariaLabelledby="land-verify-result-title">
      <CursorGlow tone="dark" />
      <div className="relative mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
        <span
          aria-hidden="true"
          className={
            cert
              ? 'flex h-14 w-14 items-center justify-center rounded-full'
              : 'flex h-14 w-14 items-center justify-center rounded-full bg-error/15 text-error'
          }
          style={cert ? { background: 'var(--land-brand-500)', color: 'var(--land-text-on-dark)' } : undefined}
        >
          {cert ? <CheckIcon width={26} height={26} /> : <AlertIcon width={26} height={26} />}
        </span>

        <h1
          id="land-verify-result-title"
          className="max-w-[13em] text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-white md:text-5xl"
          style={{ textWrap: 'balance' }}
        >
          {cert ? 'Sertifikat haqiqiy' : 'Sertifikat topilmadi'}
        </h1>
        <p className="max-w-[28em] text-lg leading-relaxed" style={{ color: 'var(--land-text-on-dark-muted)', textWrap: 'pretty' }}>
          {cert
            ? 'Bu sertifikat IMKON Digital tomonidan berilgan va haqiqiy.'
            : 'Bu ID bo‘yicha haqiqiy sertifikat topilmadi. ID ni tekshirib, qaytadan urinib ko‘ring.'}
        </p>

        <div
          className="imk-card w-full text-left"
          style={{
            background: 'var(--land-surface-onlight)',
            color: 'var(--land-text-on-light)',
            border: cert ? '1px solid var(--land-line-light)' : '1px solid rgb(var(--error) / 0.35)',
            // Karta doim yorug' (Robot Aurora onlight) — lekin --error umumiy
            // ilova tokeni bo'lib Tungi rejimda och pushti (#ff8a80) bo'lib
            // qoladi, oq fonda 2.3:1 kontrast beradi (WCAG 4.5:1 talabini
            // o'tmaydi). Shu subtree uchun yorug' rejim qiymatiga qadaymiz.
            ...({ '--error': '179 38 30' } as React.CSSProperties),
          }}
        >
          {cert ? (
            <>
              <dl className="grid gap-4 sm:grid-cols-2">
                {cert.course_title && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm" style={{ color: 'var(--land-text-on-light-dim)' }}>
                      Kurs
                    </dt>
                    <dd className="text-base font-semibold" style={{ color: 'var(--land-text-on-light)' }}>
                      {cert.course_title}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm" style={{ color: 'var(--land-text-on-light-dim)' }}>
                    Egasi
                  </dt>
                  <dd className="text-base font-semibold" style={{ color: 'var(--land-text-on-light)' }}>
                    {cert.full_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm" style={{ color: 'var(--land-text-on-light-dim)' }}>
                    Sertifikat ID
                  </dt>
                  <dd className="font-mono text-base" style={{ color: 'var(--land-text-on-light)' }}>
                    {cert.uid}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm" style={{ color: 'var(--land-text-on-light-dim)' }}>
                    Berilgan sana
                  </dt>
                  <dd className="font-mono text-base" style={{ color: 'var(--land-text-on-light)' }}>
                    {formatDate(cert.issued_at)}
                  </dd>
                </div>
              </dl>

              {cert.qr_url && (
                <div className="mt-5 flex items-center gap-4 border-t pt-5" style={{ borderColor: 'var(--land-line-light)' }}>
                  {/* Tashqi (S3/MinIO) URL — Next Image optimallashtirish kerak emas */}
                  <img
                    src={cert.qr_url}
                    alt={`${cert.uid} sertifikatini tekshirish uchun QR kod`}
                    width={64}
                    height={64}
                    className="h-16 w-16 shrink-0 rounded-lg border"
                    style={{ borderColor: 'var(--land-line-light)' }}
                  />
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--land-text-on-light-muted)' }}>
                    QR yoki ID orqali <span className="font-mono">imkon.uz/verify</span> sahifasida
                    tekshiriladi.
                  </p>
                </div>
              )}

              <div className="mt-5 flex gap-3">
                <ShareButton
                  title={`${cert.full_name} — ${cert.course_title ?? 'IMKON Digital sertifikati'}`}
                  className="imk-btn imk-btn--outline-onlight min-h-touch flex-1 justify-center"
                />
                {cert.pdf_url && (
                  <a
                    href={cert.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="imk-btn imk-btn--primary min-h-touch flex-1 justify-center"
                  >
                    PDF
                  </a>
                )}
              </div>
            </>
          ) : (
            <p className="font-mono text-base text-error">ID: {params.uid}</p>
          )}
        </div>

        <Link href="/verify" className="imk-btn imk-btn--ghost">
          Boshqa ID tekshirish
        </Link>
      </div>
    </LandingSection>
  );
}
