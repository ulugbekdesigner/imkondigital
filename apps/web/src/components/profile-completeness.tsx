import Link from 'next/link';
import { AlertIcon, ChevronRightIcon } from '@/components/shell-icons';
import type { Me } from '@/lib/types';

interface Check {
  label: string;
  done: boolean;
}

export function ProfileCompleteness({
  me,
  hasCertificateOrPortfolio,
}: {
  me: Me;
  hasCertificateOrPortfolio: boolean;
}) {
  const checks: Check[] = [
    { label: 'Ism va telefon', done: true },
    { label: 'Email', done: !!me.email },
    { label: "Tug'ilgan sana", done: !!me.birth_date },
    { label: 'Jins', done: !!me.gender },
    {
      label: 'Nogironlik profili (ixtiyoriy, moslashtirish uchun)',
      done: !!me.disability_verified_status && me.disability_verified_status !== 'none',
    },
    { label: 'Sertifikat yoki portfolio elementi', done: hasCertificateOrPortfolio },
  ];
  const doneCount = checks.filter((c) => c.done).length;
  const pct = Math.round((doneCount / checks.length) * 100);
  const missing = checks.find((c) => !c.done);

  if (pct === 100) return null;

  return (
    <div className="flex flex-col gap-3.5 rounded-[20px] border border-line bg-paper p-5">
      <span className="font-sans text-base font-bold text-ink">Profil to&apos;liqligi</span>
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-2xl font-bold tabular-nums text-ink">{pct}%</span>
        <span className="font-sans text-sm text-ink-soft">
          {doneCount}/{checks.length} bo&apos;lim
        </span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Profil to'ldirilganlik darajasi"
      >
        <div
          className="h-full rounded-full transition-all motion-reduce:transition-none"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, rgb(var(--imkon-bright)), rgb(var(--imkon-teal)))',
          }}
        />
      </div>
      {missing && (
        <div className="flex items-center gap-2.5 rounded-[14px] bg-mint p-3">
          <span
            aria-hidden="true"
            className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-warn-bg text-warn"
          >
            <AlertIcon width={15} height={15} />
          </span>
          <p className="flex-1 font-sans text-sm text-ink">
            Keyingi qadam: <span className="font-medium">{missing.label}</span>{' '}
            {missing.label.includes('Sertifikat') ? (
              <Link
                href="/kurslar"
                className="inline-flex items-center gap-0.5 rounded text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                kurslarni ko&apos;rish
                <ChevronRightIcon width={13} height={13} aria-hidden="true" />
              </Link>
            ) : (
              <a
                href="#shaxsiy-malumotlar"
                className="inline-flex items-center gap-0.5 rounded text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                pastda to&apos;ldirish
                <ChevronRightIcon width={13} height={13} aria-hidden="true" />
              </a>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
