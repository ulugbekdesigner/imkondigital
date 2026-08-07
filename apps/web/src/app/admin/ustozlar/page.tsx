import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Badge, buttonVariants, cn } from '@imkon/ui';
import { getMe } from '@/lib/server-api';
import { getAdminInstructors } from '@/lib/admin-api';
import { avatarGradient, initialsOf } from '@/lib/avatar';
import { CabinetPageHeader } from '@/components/cabinet-shell';
import { ErrorState } from '@/components/state-panels';
import { BookIcon, ChevronRightIcon, SearchIcon, StarIcon, UsersIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Ustozlar — Admin',
  robots: { index: false },
};

const GENEROSITY_LABEL: Record<string, string> = {
  bronze: 'Bronza',
  silver: 'Kumush',
  gold: 'Oltin',
};

const STATUS_LABEL: Record<string, string> = {
  pending_verification: 'Tasdiqlanmagan',
  active: 'Faol',
  blocked: 'Bloklangan',
};

const STATUS_VARIANT: Record<string, 'success' | 'warn' | 'error' | 'neutral'> = {
  pending_verification: 'warn',
  active: 'success',
  blocked: 'error',
};

export default async function AdminInstructorsPage({
  searchParams,
}: {
  searchParams: { cursor?: string; search?: string };
}) {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/admin/ustozlar');
  if (!me.roles.includes('admin')) redirect('/admin');

  const { cursor, search } = searchParams;
  const page = await getAdminInstructors({
    cursor: cursor ? Number(cursor) : undefined,
    search,
  });

  if (!page) {
    return (
      <div className="max-w-5xl">
        <CabinetPageHeader title="Ustozlar" />
        <ErrorState />
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <CabinetPageHeader
        title="Ustozlar"
        subtitle="Barcha ustozlar, ularning kurslari va statistikasi bitta joyda."
      />

      <form
        method="GET"
        className="flex h-11 max-w-md items-center gap-2 rounded-full border border-line bg-paper px-4"
      >
        <SearchIcon width={18} height={18} className="shrink-0 text-ink-soft" aria-hidden="true" />
        <input
          type="search"
          name="search"
          defaultValue={search ?? ''}
          placeholder="Ism, username yoki telefon"
          aria-label="Ustoz qidirish"
          className="w-full bg-transparent font-sans text-sm text-ink placeholder:text-ink-soft focus:outline-none"
        />
      </form>

      {page.items.length > 0 ? (
        <div
          role="table"
          aria-label="Ustozlar"
          className="mt-5 rounded-[18px] border border-line bg-paper"
        >
          <div
            role="row"
            className="hidden rounded-t-[18px] bg-surface-2 px-4 py-3 font-sans text-xs font-bold uppercase tracking-wide text-ink-soft sm:grid sm:grid-cols-[1.6fr_1fr_1.3fr_20px] sm:items-center sm:gap-3"
          >
            <span role="columnheader">Ustoz</span>
            <span role="columnheader">Holat</span>
            <span role="columnheader">Statistika</span>
            <span role="columnheader" className="sr-only">
              Ochish
            </span>
          </div>
          {page.items.map((i) => (
            <Link
              key={i.id}
              href={`/admin/ustozlar/${i.id}`}
              role="row"
              className="flex flex-col gap-3 border-t border-line px-4 py-3.5 first:border-t-0 last:rounded-b-[18px] hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset sm:grid sm:grid-cols-[1.6fr_1fr_1.3fr_20px] sm:items-center sm:gap-3"
            >
              <div role="cell" className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-sans text-xs font-bold text-white"
                  style={{ background: avatarGradient(i.id) }}
                >
                  {initialsOf(i.full_name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-sans text-sm font-bold text-ink">{i.full_name}</p>
                  <p className="truncate font-mono text-xs text-ink-soft">
                    @{i.username} · {i.phone}
                  </p>
                </div>
              </div>
              <div role="cell" className="flex flex-wrap gap-1">
                <Badge variant={STATUS_VARIANT[i.status] ?? 'neutral'}>
                  {STATUS_LABEL[i.status] ?? i.status}
                </Badge>
                {i.generosity_tier && (
                  <Badge variant="primary">
                    <StarIcon width={12} height={12} />
                    {GENEROSITY_LABEL[i.generosity_tier] ?? i.generosity_tier}
                  </Badge>
                )}
              </div>
              <div role="cell" className="flex flex-wrap items-center gap-4 font-mono text-sm text-ink-soft">
                <span className="flex items-center gap-1" title="Kurslar soni">
                  <BookIcon width={16} height={16} />
                  {i.courses_count}
                </span>
                <span title="Jami talaba">{i.total_students} talaba</span>
                <span className="flex items-center gap-1" title="O'rtacha reyting">
                  <StarIcon width={16} height={16} className="text-primary" />
                  {i.average_rating.toFixed(1)}
                </span>
              </div>
              <ChevronRightIcon
                width={16}
                height={16}
                aria-hidden="true"
                className="hidden shrink-0 text-ink-soft sm:block"
              />
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-5 flex flex-col items-center gap-3 rounded-[18px] border-2 border-dashed border-line px-6 py-12 text-center">
          <UsersIcon width={26} height={26} className="text-ink-soft" />
          <p className="font-sans text-base text-ink-soft">Hozircha ustoz yo&apos;q.</p>
        </div>
      )}

      {page.next_cursor && (
        <div className="mt-6">
          <Link
            href={`/admin/ustozlar?cursor=${page.next_cursor}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
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
