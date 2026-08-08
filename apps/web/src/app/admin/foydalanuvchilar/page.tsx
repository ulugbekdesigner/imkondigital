import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Badge, buttonVariants, cn } from '@imkon/ui';
import { getMe } from '@/lib/server-api';
import { getAdminUsers, getAdminUserStats, getModerationQueue } from '@/lib/admin-api';
import { avatarGradient, initialsOf } from '@/lib/avatar';
import { averageWaitDays, formatThousands } from '@/lib/format';
import { AdminUserActions } from '@/components/admin-user-actions';
import { CabinetPageHeader } from '@/components/cabinet-shell';
import { ErrorState } from '@/components/state-panels';
import {
  AlertIcon,
  ChevronRightIcon,
  DownloadIcon,
  SearchIcon,
  UsersIcon,
} from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Foydalanuvchilar — Admin',
  robots: { index: false },
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

const ROLE_FILTERS: { key: string; label: string; role?: string }[] = [
  { key: 'all', label: 'Hammasi' },
  { key: 'instructor', label: 'Ustozlar', role: 'instructor' },
  { key: 'employer', label: 'Ish beruvchi', role: 'employer' },
];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { cursor?: string; search?: string; role?: string; status?: string };
}) {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/admin/foydalanuvchilar');
  if (!me.roles.includes('admin')) redirect('/admin');

  const { cursor, search, role, status } = searchParams;
  const [page, stats, moderationQueue] = await Promise.all([
    getAdminUsers({ cursor: cursor ? Number(cursor) : undefined, search, role, userStatus: status }),
    getAdminUserStats(),
    getModerationQueue(),
  ]);

  if (!page) {
    return (
      <div className="max-w-5xl">
        <CabinetPageHeader title="Foydalanuvchilar" />
        <ErrorState />
      </div>
    );
  }

  const activeFilterKey =
    status === 'blocked'
      ? 'blocked'
      : !role && !status
        ? 'all'
        : (ROLE_FILTERS.find((f) => role && f.role === role)?.key ?? 'all');

  function filterHref(params: { role?: string; status?: string }) {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (params.role) qs.set('role', params.role);
    if (params.status) qs.set('status', params.status);
    const q = qs.toString();
    return `/admin/foydalanuvchilar${q ? `?${q}` : ''}`;
  }

  const exportHref = (() => {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (role) qs.set('role', role);
    if (status) qs.set('user_status', status);
    const q = qs.toString();
    return `/api/admin/users/export${q ? `?${q}` : ''}`;
  })();

  const subtitleParts = [
    stats ? `${formatThousands(stats.total)} ta` : null,
    moderationQueue.length > 0 ? `${moderationQueue.length} ta tasdiqlash kutilmoqda` : null,
  ].filter((p): p is string => p !== null);

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <CabinetPageHeader
          title="Foydalanuvchilar"
          subtitle={subtitleParts.length > 0 ? subtitleParts.join(' · ') : undefined}
        />
        <a
          href={exportHref}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
        >
          <DownloadIcon width={16} height={16} aria-hidden="true" />
          CSV eksport
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {ROLE_FILTERS.map((f) => (
          <Link
            key={f.key}
            href={filterHref(f)}
            className={buttonVariants({
              variant: activeFilterKey === f.key ? 'primary' : 'outline',
              size: 'sm',
            })}
          >
            {f.label}
          </Link>
        ))}
        <Link
          href={filterHref({ status: 'blocked' })}
          aria-current={activeFilterKey === 'blocked' ? 'page' : undefined}
          className={cn(
            'inline-flex h-9 items-center rounded-full bg-error-bg px-3.5 font-sans text-xs font-semibold text-error',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
            activeFilterKey === 'blocked' && 'ring-2 ring-error ring-offset-2 ring-offset-paper',
          )}
        >
          Bloklangan{stats ? ` ${stats.blocked}` : ''}
        </Link>
      </div>

      <form
        method="GET"
        className="mt-4 flex h-11 max-w-md items-center gap-2 rounded-full border border-line bg-paper px-4"
      >
        {role && <input type="hidden" name="role" value={role} />}
        {status && <input type="hidden" name="status" value={status} />}
        <SearchIcon width={18} height={18} className="shrink-0 text-ink-soft" aria-hidden="true" />
        <input
          type="search"
          name="search"
          defaultValue={search ?? ''}
          placeholder="Ism, username yoki telefon"
          aria-label="Foydalanuvchi qidirish"
          className="w-full bg-transparent font-sans text-sm text-ink placeholder:text-ink-soft focus:outline-none"
        />
      </form>

      {page.items.length > 0 ? (
        <div
          role="table"
          aria-label="Foydalanuvchilar"
          className="mt-5 rounded-card border border-line bg-paper"
        >
          <div
            role="row"
            className="hidden rounded-t-[18px] bg-surface-2 px-4 py-3 font-sans text-xs font-bold uppercase tracking-wide text-ink-soft sm:grid sm:grid-cols-[1.5fr_1fr_0.9fr_44px] sm:items-center sm:gap-3"
          >
            <span role="columnheader">Foydalanuvchi</span>
            <span role="columnheader">Rollar</span>
            <span role="columnheader">Holat</span>
            <span role="columnheader" className="sr-only">
              Amallar
            </span>
          </div>
          {page.items.map((u) => (
            <div
              key={u.id}
              role="row"
              className="flex flex-col gap-3 border-t border-line px-4 py-3.5 first:border-t-0 last:rounded-b-[18px] sm:grid sm:grid-cols-[1.5fr_1fr_0.9fr_44px] sm:items-center sm:gap-3"
            >
              <div role="cell" className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-sans text-xs font-bold text-white"
                  style={{ background: avatarGradient(u.id) }}
                >
                  {initialsOf(u.full_name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-sans text-sm font-bold text-ink">{u.full_name}</p>
                  <p className="truncate font-mono text-xs text-ink-soft">{u.phone}</p>
                </div>
              </div>
              <div role="cell" className="flex flex-wrap gap-1">
                {u.roles.map((r) => (
                  <span
                    key={r}
                    className="rounded-full bg-surface-2 px-2.5 py-1 font-sans text-xs font-semibold text-ink-soft"
                  >
                    {r}
                  </span>
                ))}
              </div>
              <div role="cell" className="flex flex-wrap items-center gap-1.5">
                <Badge variant={STATUS_VARIANT[u.status] ?? 'neutral'}>
                  {STATUS_LABEL[u.status] ?? u.status}
                </Badge>
                {u.subscription_plan !== 'free' && (
                  <Badge variant="primary">{u.subscription_plan.toUpperCase()}</Badge>
                )}
              </div>
              <div role="cell" className="sm:justify-self-center">
                <AdminUserActions
                  userId={u.id}
                  fullName={u.full_name}
                  status={u.status}
                  roles={u.roles}
                  subscriptionPlan={u.subscription_plan}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 flex flex-col items-center gap-3 rounded-card border-2 border-dashed border-line px-6 py-12 text-center">
          <UsersIcon width={26} height={26} className="text-ink-soft" />
          <p className="font-sans text-base text-ink-soft">Hech kim topilmadi.</p>
        </div>
      )}

      {page.next_cursor !== null && (
        <div className="mt-6">
          <Link
            href={`/admin/foydalanuvchilar?cursor=${page.next_cursor}${search ? `&search=${encodeURIComponent(search)}` : ''}${role ? `&role=${role}` : ''}${status ? `&status=${status}` : ''}`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1')}
          >
            Keyingi
            <ChevronRightIcon width={16} height={16} />
          </Link>
        </div>
      )}

      {moderationQueue.length > 0 && (
        <div className="mt-6 flex flex-col items-start gap-4 rounded-card border border-line bg-paper p-4 sm:flex-row sm:items-center sm:gap-3.5">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-warn-bg text-warn"
          >
            <AlertIcon width={20} height={20} />
          </span>
          <div className="flex-1">
            <p className="font-sans text-base font-bold text-ink">
              {moderationQueue.length} ta nogironlik profili tasdiqlanmagan
            </p>
            <p className="font-sans text-sm text-ink-soft">
              Moderatsiya navbati
              {(() => {
                const avg = averageWaitDays(moderationQueue.map((q) => q.submitted_at));
                return avg !== null ? ` · o'rtacha kutish ${avg.toFixed(1)} kun` : '';
              })()}
            </p>
          </div>
          <Link href="/admin#nogironlik-navbati" className={buttonVariants({ size: 'sm' })}>
            Navbatga o&apos;tish
          </Link>
        </div>
      )}
    </div>
  );
}
