import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Badge, buttonVariants, cn } from '@imkon/ui';
import { getMe } from '@/lib/server-api';
import { getAdminCompanies } from '@/lib/admin-api';
import { AdminCompanyVerifyButton } from '@/components/admin-company-verify-button';
import { CabinetPageHeader } from '@/components/cabinet-shell';
import { QueueEmpty } from '@/components/admin-queue-states';
import { ErrorState } from '@/components/state-panels';
import { BuildingIcon, ChevronRightIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Kompaniyalar — Admin',
  robots: { index: false },
};

const FILTERS: { key: string; label: string; verified?: 'true' | 'false' }[] = [
  { key: 'all', label: 'Hammasi' },
  { key: 'false', label: 'Tasdiqlanmagan', verified: 'false' },
  { key: 'true', label: 'Tasdiqlangan', verified: 'true' },
];

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: { cursor?: string; verified?: string };
}) {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/admin/kompaniyalar');
  if (!me.roles.includes('admin')) redirect('/admin');

  const { cursor, verified } = searchParams;
  const page = await getAdminCompanies({
    cursor: cursor ? Number(cursor) : undefined,
    verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
  });

  if (!page) {
    return (
      <div className="max-w-4xl">
        <CabinetPageHeader title="Kompaniyalar" />
        <ErrorState />
      </div>
    );
  }

  const activeKey = verified === 'true' || verified === 'false' ? verified : 'all';

  return (
    <div className="max-w-4xl">
      <CabinetPageHeader
        title="Kompaniyalar"
        subtitle={
          '"Tasdiqlangan ish beruvchi" belgisi — hujjat/aloqa tekshirilgan kompaniyalarga beriladi, vakansiya kartalarida ko\'rinadi (ishonch signali).'
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/kompaniyalar${f.verified ? `?verified=${f.verified}` : ''}`}
            className={buttonVariants({ variant: activeKey === f.key ? 'primary' : 'outline', size: 'sm' })}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {page.items.length > 0 ? (
        <div
          role="table"
          aria-label="Kompaniyalar"
          className="mt-5 rounded-card border border-line bg-paper"
        >
          <div
            role="row"
            className="hidden rounded-t-[18px] bg-surface-2 px-4 py-3 font-sans text-xs font-bold uppercase tracking-wide text-ink-soft sm:grid sm:grid-cols-[1.6fr_0.8fr_0.8fr_0.7fr_0.9fr_150px] sm:items-center sm:gap-3"
          >
            <span role="columnheader">Kompaniya</span>
            <span role="columnheader">STIR</span>
            <span role="columnheader">Xodimlar</span>
            <span role="columnheader">Vakansiya</span>
            <span role="columnheader">Holat</span>
            <span role="columnheader" className="sr-only">
              Amallar
            </span>
          </div>
          {page.items.map((c) => (
            <div
              key={c.id}
              role="row"
              className="flex flex-col gap-3 border-t border-line px-4 py-3.5 first:border-t-0 last:rounded-b-[18px] sm:grid sm:grid-cols-[1.6fr_0.8fr_0.8fr_0.7fr_0.9fr_150px] sm:items-center sm:gap-3"
            >
              <div role="cell" className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mint text-ink"
                >
                  <BuildingIcon width={18} height={18} />
                </span>
                <p className="truncate font-sans text-sm font-bold text-ink">{c.name}</p>
              </div>
              <div role="cell" className="font-mono text-xs text-ink-soft">
                {c.inn ?? "yo'q"}
              </div>
              <div role="cell" className="font-mono text-sm text-ink-soft">
                {c.employee_count ?? "ko'rsatilmagan"}
              </div>
              <div role="cell" className="font-mono text-sm text-ink-soft">
                {c.vacancies_count}
              </div>
              <div role="cell">
                <Badge variant={c.verified ? 'success' : 'neutral'}>
                  {c.verified ? 'Tasdiqlangan' : 'Tasdiqlanmagan'}
                </Badge>
              </div>
              <div role="cell">
                <AdminCompanyVerifyButton companyId={c.id} verified={c.verified} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <QueueEmpty
            Icon={BuildingIcon}
            title="Kompaniya topilmadi"
            message="Tanlangan filtrga mos kompaniya yo'q — boshqa filtrni sinab ko'ring."
            ctaHref="/admin/kompaniyalar"
            ctaLabel="Barcha kompaniyalar"
          />
        </div>
      )}

      {page.next_cursor && (
        <div className="mt-6">
          <Link
            href={`/admin/kompaniyalar?cursor=${page.next_cursor}${verified ? `&verified=${verified}` : ''}`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1')}
          >
            Keyingi sahifa
            <ChevronRightIcon width={16} height={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
