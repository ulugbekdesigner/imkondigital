import type { ComponentType, SVGProps } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Badge, buttonVariants } from '@imkon/ui';
import { getMe, getMyDisabilityProfile } from '@/lib/server-api';
import { getMyCertificates, getMyPortfolio } from '@/lib/passport-api';
import { getMyApplications } from '@/lib/employer-api';
import { getMyOrders } from '@/lib/marketplace-api';
import { getMyEnrollments } from '@/lib/courses-api';
import { getMySubmissionsAll } from '@/lib/assessment-api';
import { getTelegramStatus } from '@/lib/notifications-api';
import { getRegions } from '@/lib/regions-api';
import { avatarGradient } from '@/lib/avatar';
import { LogoutButton } from '@/components/logout-button';
import { ProfileShareActions } from '@/components/profile-share-actions';
import { ProfileCompleteness } from '@/components/profile-completeness';
import { ProfileTabs } from '@/components/profile-tabs';
import type { Me } from '@/lib/types';
import {
  BookIcon,
  BriefcaseIcon,
  BuildingIcon,
  EyeIcon,
  EyeOffIcon,
  HeartIcon,
  PlusIcon,
  ShieldIcon,
  UsersIcon,
} from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Profil',
  description: 'IMKON Digital profilingiz.',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Faol',
  pending_verification: 'Tasdiqlanmagan',
  blocked: 'Bloklangan',
};

const ROLE_META: Record<string, { label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }> = {
  instructor: { label: 'Ustoz', Icon: BookIcon },
  employer: { label: 'Ish beruvchi', Icon: BriefcaseIcon },
  mentor: { label: 'Mentor', Icon: UsersIcon },
  donor: { label: 'Donor', Icon: HeartIcon },
  gov: { label: 'Davlat vakili', Icon: BuildingIcon },
  moderator: { label: 'Moderator', Icon: ShieldIcon },
  admin: { label: 'Administrator', Icon: ShieldIcon },
};

const VISIBILITY_META: Record<
  Me['passport_visibility'],
  { label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }
> = {
  public: { label: 'Ochiq passport', Icon: EyeIcon },
  unlisted: { label: 'Havola bilan ochiq', Icon: EyeIcon },
  private: { label: 'Yopiq passport', Icon: EyeOffIcon },
};

/** Avatar rasmi bo'lmaganda ism bosh harflaridan fallback belgi. */
function getInitials(fullName: string): string {
  const letters = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '');
  return letters.join('') || '?';
}

export default async function ProfilePage() {
  const me = await getMe();
  if (!me) {
    redirect('/kirish?next=/profil');
  }

  const [
    certificates,
    portfolio,
    applications,
    orders,
    enrollments,
    submissions,
    telegramStatus,
    regions,
    disabilityProfile,
  ] = await Promise.all([
    getMyCertificates(),
    getMyPortfolio(),
    getMyApplications(),
    getMyOrders(),
    getMyEnrollments(),
    getMySubmissionsAll(),
    getTelegramStatus(),
    getRegions(),
    getMyDisabilityProfile(),
  ]);

  const regionName = regions.find((r) => r.id === me.region_id)?.name;
  const visibility = VISIBILITY_META[me.passport_visibility];
  const profileVerified = me.disability_verified_status === 'verified';

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-bright/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-[20px] border border-line bg-paper p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {me.avatar_url ? (
                // Foydalanuvchi yuklagan tashqi (MinIO) media — next/image optimallashtira olmaydi.
                <img
                  src={me.avatar_url}
                  alt=""
                  className="h-[88px] w-[88px] shrink-0 rounded-full object-cover ring-2 ring-line"
                  loading="lazy"
                />
              ) : (
                <div
                  aria-hidden="true"
                  style={{ background: avatarGradient(me.id) }}
                  className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-full font-display text-2xl font-bold text-white"
                >
                  {getInitials(me.full_name)}
                </div>
              )}
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
                  {me.full_name}
                </h1>
                <p className="mt-1 font-sans text-sm text-ink-soft">
                  @{me.username}
                  {regionName && <> · {regionName}</>}
                </p>
                <p className="font-mono text-sm text-ink-soft">{me.phone}</p>
              </div>
            </div>
            <LogoutButton />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {me.ladder_step > 0 && (
              <span className="inline-flex items-center rounded-full bg-bright px-3 py-1.5 font-sans text-xs font-semibold text-white">
                {me.ladder_step}-pog&apos;ona
              </span>
            )}
            {profileVerified && (
              <Badge variant="success">Profil tasdiqlangan</Badge>
            )}
            {visibility && (
              <Badge variant="neutral">
                <visibility.Icon width={14} height={14} />
                {visibility.label}
              </Badge>
            )}
            <Badge variant={me.status === 'active' ? 'primary' : 'warn'}>
              {STATUS_LABELS[me.status] ?? me.status}
            </Badge>
            {me.roles
              .filter((r) => r !== 'user')
              .map((r) => {
                const meta = ROLE_META[r];
                return (
                  <Badge key={r}>
                    {meta ? <meta.Icon width={14} height={14} /> : null}
                    {meta?.label ?? r}
                  </Badge>
                );
              })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <ProfileShareActions username={me.username} fullName={me.full_name} />
            <a
              href="#sozlamalar"
              className="font-sans text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Ma&apos;lumotlarimni yuklab olish
            </a>
          </div>
        </div>

        <div className="mt-6">
          <ProfileCompleteness
            me={me}
            hasCertificateOrPortfolio={certificates.length > 0 || portfolio.length > 0}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3.5 rounded-[20px] border border-line bg-paper p-5">
          <div className="flex items-center justify-between">
            <span className="font-sans text-base font-bold text-ink">
              Portfolio · {portfolio.length} ish
            </span>
            <a
              href="#yutuqlarim"
              className="font-sans text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Yangi ish qo&apos;shish
            </a>
          </div>
          {portfolio.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {portfolio.slice(0, 3).map((item) => (
                <a
                  key={item.id}
                  href="#yutuqlarim"
                  className="overflow-hidden rounded-2xl border border-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  <div className="h-[78px]" style={{ background: avatarGradient(item.id) }} />
                  <div className="flex flex-col gap-0.5 p-3">
                    <span className="truncate font-sans text-sm font-bold text-ink">
                      {item.title}
                    </span>
                    <span className="truncate font-sans text-xs text-ink-soft">
                      {item.skills.length > 0 ? item.skills.join(' · ') : 'Portfolio ishi'}
                    </span>
                  </div>
                </a>
              ))}
              <a
                href="#yutuqlarim"
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line py-6 text-primary hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                <PlusIcon width={22} height={22} aria-hidden="true" />
                <span className="font-sans text-xs font-semibold">Qo&apos;shish</span>
              </a>
            </div>
          ) : (
            <a
              href="#yutuqlarim"
              className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-8 text-center text-ink-soft hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <PlusIcon width={22} height={22} aria-hidden="true" className="text-primary" />
              <span className="font-sans text-sm">Hali portfolio ishi yo&apos;q — birinchisini qo&apos;shing</span>
            </a>
          )}
        </div>

        <div className="mt-8 border-t border-line pt-6">
          <p className="font-sans text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Tezkor bo'limlar
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/mening-yolim" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Mening yo&apos;lim
            </Link>
            <Link
              href={`/u/${me.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Passportni ko&apos;rish
            </Link>
            <Link href="/karyera-kochi" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Career Coach
            </Link>
            <Link href="/cv-yaratish" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              CV Builder
            </Link>
            <Link href="/suhbat-mashqi" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Interview Coach
            </Link>
            <Link href="/ustoz" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Ustoz kabineti
            </Link>
            {(me.roles.includes('instructor') || me.roles.includes('admin')) && (
              <Link href="/ustoz/kurslar" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Kurslarim
              </Link>
            )}
            {(me.roles.includes('admin') || me.roles.includes('moderator')) && (
              <Link href="/admin" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Admin panel
              </Link>
            )}
            {me.roles.includes('donor') && (
              <Link href="/donor" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Donor kabineti
              </Link>
            )}
            {me.roles.includes('gov') && (
              <Link href="/davlat" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Davlat dashboard
              </Link>
            )}
          </div>
        </div>

        <ProfileTabs
          me={me}
          regions={regions}
          certificates={certificates}
          portfolio={portfolio}
          applications={applications}
          orders={orders}
          enrollments={enrollments}
          submissions={submissions}
          telegramLinked={telegramStatus.linked}
          disabilityRejectionReason={disabilityProfile?.rejection_reason ?? null}
          disabilityDocUrl={disabilityProfile?.doc_url ?? null}
        />

        <div className="mt-8">
          <Link href="/trayektoriya" className={buttonVariants()}>
            Trayektoriyamni ko'rish
          </Link>
        </div>
      </div>
    </div>
  );
}
