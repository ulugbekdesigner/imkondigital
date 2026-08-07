import Link from 'next/link';
import { Badge, buttonVariants } from '@imkon/ui';
import type { Certificate } from '@/lib/types';
import { CheckIcon, ChevronRightIcon } from '@/components/shell-icons';
import { formatDate } from '@/lib/format';

export function CertificateCard({
  cert,
  variant = 'list',
  tone = 'paper',
}: {
  cert: Certificate;
  /** 'compact' — Profil → Yutuqlarim grid kartasi (eyebrow + QR belgisi). */
  variant?: 'list' | 'compact';
  /** 'onlight' — ochiq passport (/u/[username]) Robot Aurora uslubi. Faqat 'list' bilan ishlaydi. */
  tone?: 'paper' | 'onlight';
}) {
  if (variant === 'compact') {
    return (
      <li className="flex flex-col gap-2 rounded-2xl border border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-sans text-xs font-bold uppercase tracking-wide text-ink-soft">
            Sertifikat
          </span>
          {cert.qr_url && <Badge variant="success">QR bilan</Badge>}
        </div>
        <span className="font-sans text-base font-bold text-ink">{cert.course_title ?? 'Kurs'}</span>
        <span className="font-mono text-xs text-ink-soft">
          ID: {cert.uid} · {formatDate(cert.issued_at)}
        </span>
        {cert.confirmed_at && (
          <Badge variant="success" className="self-start">
            <CheckIcon width={14} height={14} />
            Ko'nikma tasdiqlangan{cert.readiness_pct != null ? ` (${cert.readiness_pct}%)` : ''}
          </Badge>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link
            href={`/verify/${cert.uid}`}
            className="inline-flex min-h-touch items-center gap-1 rounded font-sans text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            Tekshirish sahifasi
            <ChevronRightIcon width={14} height={14} aria-hidden="true" />
          </Link>
          {cert.pdf_url && (
            <a
              href={cert.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-touch items-center rounded font-sans text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            >
              PDF yuklab olish
            </a>
          )}
        </div>
      </li>
    );
  }

  if (tone === 'onlight') {
    return (
      <li className="imk-card imk-card--onlight">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold" style={{ color: 'var(--land-text-on-light)' }}>
            {cert.course_title ?? 'Kurs'}
          </h3>
          <Badge variant="success">Tasdiqlangan</Badge>
        </div>
        <p className="font-mono text-xs" style={{ color: 'var(--land-text-on-light-dim)' }}>
          ID: {cert.uid} · {formatDate(cert.issued_at)}
        </p>
        {cert.confirmed_at && (
          <Badge variant="success">
            <CheckIcon width={14} height={14} />
            Ko'nikma tasdiqlangan{cert.readiness_pct != null ? ` (${cert.readiness_pct}%)` : ''}
          </Badge>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href={`/verify/${cert.uid}`}
            className="inline-flex min-h-touch items-center gap-1 rounded text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            style={{ color: 'var(--land-brand-600)' }}
          >
            Tekshirish sahifasi
            <ChevronRightIcon width={14} height={14} aria-hidden="true" />
          </Link>
          {cert.pdf_url && (
            <a
              href={cert.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-touch items-center rounded text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
              style={{ color: 'var(--land-brand-600)' }}
            >
              PDF yuklab olish
            </a>
          )}
        </div>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-line bg-paper p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-base font-semibold text-ink">
          {cert.course_title ?? 'Kurs'}
        </h3>
        <Badge variant="success">Tasdiqlangan</Badge>
      </div>
      <p className="font-mono text-xs text-ink-soft">
        ID: {cert.uid} · {formatDate(cert.issued_at)}
      </p>
      {cert.confirmed_at && (
        <Badge variant="success">
          <CheckIcon width={14} height={14} />
          Ko'nikma tasdiqlangan{cert.readiness_pct != null ? ` (${cert.readiness_pct}%)` : ''}
        </Badge>
      )}
      <div className="flex flex-wrap gap-2">
        <Link href={`/verify/${cert.uid}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Tekshirish
        </Link>
        {cert.pdf_url && (
          <a
            href={cert.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            PDF yuklab olish
          </a>
        )}
      </div>
    </li>
  );
}
