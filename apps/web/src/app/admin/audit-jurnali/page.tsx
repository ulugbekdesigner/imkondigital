import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { buttonVariants, cn } from '@imkon/ui';
import { getMe } from '@/lib/server-api';
import { getAuditLog } from '@/lib/admin-api';
import { CabinetPageHeader } from '@/components/cabinet-shell';
import { QueueEmpty } from '@/components/admin-queue-states';
import { ErrorState } from '@/components/state-panels';
import { ChevronRightIcon, DownloadIcon, LockIcon, LogIcon } from '@/components/shell-icons';
import { formatDateTime } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Audit jurnali — Admin',
  robots: { index: false },
};

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: { cursor?: string };
}) {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/admin/audit-jurnali');
  if (!me.roles.includes('admin')) redirect('/admin');

  const cursor = searchParams.cursor ? Number(searchParams.cursor) : undefined;
  const page = await getAuditLog(cursor);

  if (!page) {
    return (
      <div className="max-w-4xl">
        <CabinetPageHeader title="Audit jurnali" />
        <ErrorState />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <CabinetPageHeader
          title="Audit jurnali"
          subtitle="Admin va moderatorlarning kritik amallari — foydalanuvchi holati, rol o'zgarishi, nogironlik profili tasdig'i, kurs arxivlash."
        />
        <a
          href="/api/admin/audit-log/export"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
        >
          <DownloadIcon width={16} height={16} aria-hidden="true" />
          CSV eksport
        </a>
      </div>

      <div className="mb-4 flex items-center gap-2 font-sans text-sm text-ink-soft">
        <LockIcon width={16} height={16} className="shrink-0" />
        <span>Bu yozuvlarni o&apos;chirish imkoni yo&apos;q — barcha kritik amallar doimiy saqlanadi.</span>
      </div>

      {page.items.length > 0 ? (
        <div
          role="table"
          aria-label="Audit jurnali"
          className="rounded-[18px] border border-line bg-paper"
        >
          <div
            role="row"
            className="hidden rounded-t-[18px] bg-surface-2 px-4 py-3 font-sans text-xs font-bold uppercase tracking-wide text-ink-soft sm:grid sm:grid-cols-[130px_1fr_1.3fr_1fr] sm:items-center sm:gap-3"
          >
            <span role="columnheader">Vaqt</span>
            <span role="columnheader">Kim</span>
            <span role="columnheader">Amal</span>
            <span role="columnheader">Nishon</span>
          </div>
          {page.items.map((entry) => (
            <div
              key={entry.id}
              role="row"
              className="flex flex-col gap-1 border-t border-line px-4 py-3.5 first:border-t-0 last:rounded-b-[18px] sm:grid sm:grid-cols-[130px_1fr_1.3fr_1fr] sm:items-center sm:gap-3"
            >
              <div role="cell" className="whitespace-nowrap font-mono text-xs text-ink-soft">
                {formatDateTime(entry.created_at)}
              </div>
              <div role="cell" className="font-sans text-sm text-ink">
                {entry.actor_name}
              </div>
              <div role="cell" className="font-sans text-sm text-ink">
                {entry.action_label}
              </div>
              <div role="cell" className="truncate font-sans text-sm text-ink-soft">
                {entry.target_name ?? `${entry.target_type}#${entry.target_id}`}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <QueueEmpty
          Icon={LogIcon}
          title="Jurnal bo'sh"
          message="Hali hech qanday kritik admin amali qayd etilmagan."
          ctaHref="/admin/audit-jurnali"
          ctaLabel="Yangilash"
        />
      )}

      {page.next_cursor !== null && (
        <div className="mt-6">
          <Link
            href={`/admin/audit-jurnali?cursor=${page.next_cursor}`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1')}
          >
            Keyingi
            <ChevronRightIcon width={16} height={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
