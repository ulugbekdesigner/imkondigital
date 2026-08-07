import Link from 'next/link';
import { cn } from '@imkon/ui';
import { CheckIcon } from '@/components/shell-icons';

function QueueRow({
  count,
  badgeClass,
  label,
  href,
}: {
  count: number | string;
  badgeClass: string;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[14px] border border-line px-[15px] py-[13px] hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
    >
      <span
        className={cn(
          'flex h-[30px] min-w-[30px] shrink-0 items-center justify-center rounded-full px-1 font-sans text-xs font-bold text-white',
          badgeClass,
        )}
      >
        {count}
      </span>
      <span className="flex-1 font-sans text-sm font-semibold text-ink">{label}</span>
      <span className="font-sans text-xs font-semibold text-primary">Ochish</span>
    </Link>
  );
}

export function PendingQueuesCard({
  disabilityCount,
  companiesCount,
  companiesCapped,
  courseCount,
  disputeCount,
}: {
  disabilityCount: number;
  companiesCount: number;
  companiesCapped: boolean;
  courseCount: number;
  disputeCount: number;
}) {
  const empty = disabilityCount === 0 && companiesCount === 0 && courseCount === 0 && disputeCount === 0;
  return (
    <div className="flex flex-col gap-3.5 rounded-xl border border-line bg-paper p-5">
      <span className="font-sans text-base font-bold text-ink">Navbatda turgan ishlar</span>
      {empty ? (
        <div className="flex items-center gap-3 rounded-[14px] border border-dashed border-line px-[15px] py-[13px]">
          <CheckIcon width={18} height={18} className="shrink-0 text-primary" />
          <p className="font-sans text-sm text-ink-soft">Navbat bo&apos;sh — barchasi ko&apos;rib chiqilgan.</p>
        </div>
      ) : (
        <>
          {disabilityCount > 0 && (
            <QueueRow
              count={disabilityCount}
              badgeClass="bg-bright"
              label="Nogironlik profili"
              href="#nogironlik-navbati"
            />
          )}
          {courseCount > 0 && (
            <QueueRow
              count={courseCount}
              badgeClass="bg-primary"
              label="Kurs moderatsiyasi"
              href="#kurs-moderatsiyasi"
            />
          )}
          {companiesCount > 0 && (
            <QueueRow
              count={companiesCapped ? '100+' : companiesCount}
              badgeClass="bg-ink"
              label="Kompaniya tasdiqlash"
              href="/admin/kompaniyalar?verified=false"
            />
          )}
          {disputeCount > 0 && (
            <QueueRow
              count={disputeCount}
              badgeClass="bg-error"
              label="Nizolar"
              href="#nizolar-navbati"
            />
          )}
        </>
      )}
    </div>
  );
}
