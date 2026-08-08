import type { ComponentType, SVGProps } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CountUp } from '@imkon/ui';
import { getMe } from '@/lib/server-api';
import { avatarGradient, initialsOf } from '@/lib/avatar';
import { formatRelativeTime, formatThousands } from '@/lib/format';
import {
  getAdminCompanies,
  getAdminCourses,
  getAdminOverview,
  getAdminSuccessStories,
  getExternalJobsSyncStatus,
  getModerationQueue,
  getOpenDisputes,
  getPendingCourses,
  getRegistrationsDaily,
} from '@/lib/admin-api';
import type { AdminOverview } from '@/lib/types';
import { ModerationDecisionButtons } from '@/components/moderation-decision-buttons';
import { CourseArchiveButton } from '@/components/course-archive-button';
import { CourseDecisionButtons } from '@/components/course-decision-buttons';
import { DisputeResolveButtons } from '@/components/dispute-resolve-buttons';
import { ExternalJobsSyncPanel } from '@/components/external-jobs-sync-panel';
import { SuccessStoryModerationCard } from '@/components/success-story-moderation-card';
import { PendingQueuesCard } from '@/components/pending-queues-card';
import { QueueEmpty, QueueError, LockedNotice } from '@/components/admin-queue-states';
import { RegistrationsBarChart } from '@/components/registrations-bar-chart';
import { CabinetPageHeader } from '@/components/cabinet-shell';
import {
  AlertIcon,
  AttachIcon,
  BookIcon,
  BriefcaseIcon,
  CheckIcon,
  ClipboardIcon,
  GearIcon,
  HeartIcon,
  LockIcon,
  RouteIcon,
  ShieldIcon,
  StarIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
} from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Admin panel',
  robots: { index: false },
};

const VERIFY_LABEL: Record<string, string> = {
  pending: "Tasdiq kutilmoqda",
  verified: 'Tasdiqlangan',
  rejected: 'Rad etilgan',
};

const OVERVIEW_CARDS: {
  key: keyof AdminOverview;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
  { key: 'total_users', label: 'Jami foydalanuvchi', Icon: UsersIcon },
  { key: 'active_users', label: 'Faol foydalanuvchi', Icon: CheckIcon },
  { key: 'verified_disability_profiles', label: 'Tasdiqlangan profil', Icon: ShieldIcon },
  { key: 'published_courses', label: 'Chop etilgan kurs', Icon: BookIcon },
  { key: 'total_enrollments', label: "Ro'yxatga olingan", Icon: ClipboardIcon },
  { key: 'completed_enrollments', label: 'Kursni tugatgan', Icon: StarIcon },
  { key: 'published_vacancies', label: 'Faol vakansiya', Icon: BriefcaseIcon },
  { key: 'placements', label: 'Ishga joylashgan', Icon: RouteIcon },
  { key: 'active_gigs', label: 'Faol xizmat (gig)', Icon: GearIcon },
  { key: 'paid_orders_volume', label: "To'langan buyurtma (so'm)", Icon: WalletIcon },
  { key: 'benefit_claims', label: 'Olingan imtiyoz', Icon: HeartIcon },
  { key: 'active_mentorships', label: 'Faol mentorlik', Icon: UserIcon },
];

const COMPANIES_QUEUE_LIMIT = 100;

export default async function AdminPage() {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/admin');
  const isAdmin = me.roles.includes('admin');
  const isModerator = me.roles.includes('moderator');
  if (!isAdmin && !isModerator) redirect('/profil');

  const [
    queue,
    courses,
    pendingCourses,
    disputes,
    overview,
    registrationsDaily,
    syncStatus,
    successStories,
    unverifiedCompanies,
  ] = await Promise.all([
    getModerationQueue(),
    getAdminCourses(),
    getPendingCourses(),
    getOpenDisputes(),
    isAdmin ? getAdminOverview() : Promise.resolve(null),
    isAdmin ? getRegistrationsDaily() : Promise.resolve(null),
    isAdmin ? getExternalJobsSyncStatus() : Promise.resolve(null),
    isAdmin ? getAdminSuccessStories() : Promise.resolve([]),
    isAdmin ? getAdminCompanies({ verified: false, limit: COMPANIES_QUEUE_LIMIT }) : Promise.resolve(null),
  ]);
  const publishedCourses = courses.items.filter((c) => c.status === 'published');
  const draftStories = successStories.filter((s) => s.status === 'draft');

  return (
    <div className="max-w-6xl">
      <CabinetPageHeader
        title="Umumiy holat"
        subtitle="Platforma bo'yicha umumiy ko'rsatkichlar, moderatsiya navbati va kurslar."
      />

      {isAdmin ? (
        <>
          <section className="mb-8">
            {overview ? (
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
                {OVERVIEW_CARDS.map(({ key, label, Icon }) => (
                  <div
                    key={key}
                    className="flex flex-col gap-1.5 rounded-card border border-line bg-paper p-[18px]"
                  >
                    <Icon width={16} height={16} className="text-ink-soft" />
                    <CountUp value={overview[key]} className="font-mono text-xl font-bold tabular-nums text-ink" />
                    <p className="font-sans text-xs font-bold uppercase tracking-wide text-ink-soft">{label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div
                role="alert"
                className="flex items-center gap-3 rounded-xl border border-error px-6 py-5"
              >
                <AlertIcon width={20} height={20} className="shrink-0 text-error" />
                <div>
                  <p className="font-sans text-base text-ink">Statistikani yuklab bo&apos;lmadi.</p>
                  <Link href="/admin" className="font-sans text-sm text-primary underline-offset-4 hover:underline">
                    Qayta urinish
                  </Link>
                </div>
              </div>
            )}
          </section>

          <section className="mb-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <RegistrationsBarChart days={registrationsDaily?.days ?? []} />
            <PendingQueuesCard
              disabilityCount={queue.length}
              companiesCount={unverifiedCompanies?.items.length ?? 0}
              companiesCapped={unverifiedCompanies != null && unverifiedCompanies.next_cursor != null}
              courseCount={pendingCourses?.items.length ?? 0}
              disputeCount={disputes?.items.length ?? 0}
            />
          </section>

          <section className="mb-8 grid gap-4 lg:grid-cols-2">
            <ExternalJobsSyncPanel initialStatus={syncStatus} />
            <SuccessStoryModerationCard stories={draftStories} />
          </section>
        </>
      ) : (
        <section className="mb-8">
          <LockedNotice>
            Umumiy statistika, ro&apos;yxatga olish grafigi, kompaniya tasdiqlash navbati, xalqaro ishlar
            sinxroni va muvaffaqiyat hikoyalari nashri — bu panellar faqat administrator rolida ochiladi.
          </LockedNotice>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section id="nogironlik-navbati">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">Nogironlik tasdig&apos;i navbati</h2>
            {queue.length > 0 && (
              <span className="rounded-full bg-warn-bg px-3 py-1 font-sans text-xs font-semibold text-warn">
                {queue.length} ta kutilmoqda
              </span>
            )}
          </div>
          <p className="mt-1 flex items-center gap-1.5 font-sans text-xs text-ink-soft">
            <LockIcon width={13} height={13} className="shrink-0" aria-hidden="true" />
            Hujjatlar faqat shu moderatsiya vazifasi uchun ko&apos;rinadi, maxfiy saqlanadi va boshqa
            foydalanuvchilarga ochilmaydi.
          </p>
          {queue.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-3">
              {queue.map((item) => (
                <li key={item.user_id} className="flex flex-col gap-3 rounded-xl border border-line bg-paper p-4">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold text-white"
                      style={{ background: avatarGradient(item.user_id) }}
                    >
                      {initialsOf(item.full_name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-sans text-base font-semibold text-ink">
                        Nogironlik profili · #{item.user_id}
                      </p>
                      <p className="font-sans text-xs text-ink-soft">
                        Yuborilgan: {formatRelativeTime(item.submitted_at)}
                        {item.region_name && ` · ${item.region_name}`}
                      </p>
                    </div>
                  </div>
                  <p className="font-sans text-xs text-ink-soft">
                    {item.full_name} · Guruh: {item.group_type ?? "ko'rsatilmagan"} ·{' '}
                    {VERIFY_LABEL[item.verified_status] ?? item.verified_status}
                    {item.categories.length > 0 && ` · ${item.categories.join(', ')}`}
                  </p>
                  {item.doc_url ? (
                    <a
                      href={item.doc_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-fit items-center gap-1.5 font-sans text-sm text-primary underline-offset-4 hover:underline"
                    >
                      <AttachIcon width={16} height={16} aria-hidden="true" />
                      Tasdiqlovchi hujjatni ochish
                    </a>
                  ) : (
                    <p className="font-sans text-xs text-error">Hujjat biriktirilmagan</p>
                  )}
                  <ModerationDecisionButtons userId={item.user_id} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-dashed border-line px-6 py-5">
              <CheckIcon width={20} height={20} className="shrink-0 text-primary" />
              <p className="font-sans text-base text-ink-soft">Navbat bo&apos;sh — barcha profillar ko&apos;rib chiqilgan.</p>
            </div>
          )}
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">Chop etilgan kurslar</h2>
          {publishedCourses.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-2">
              {publishedCourses.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-col gap-3 rounded-lg border border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <BookIcon width={18} height={18} className="mt-0.5 shrink-0 text-ink-soft" />
                    <div>
                      <p className="font-sans text-base font-medium text-ink">{c.title}</p>
                      <p className="font-sans text-xs text-ink-soft">
                        Ustoz: {c.instructor_name} · {c.students_count} talaba
                      </p>
                    </div>
                  </div>
                  <CourseArchiveButton courseId={c.id} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-dashed border-line px-6 py-5">
              <BookIcon width={20} height={20} className="shrink-0 text-ink-soft" />
              <p className="font-sans text-base text-ink-soft">Chop etilgan kurs yo&apos;q.</p>
            </div>
          )}
        </section>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section id="kurs-moderatsiyasi">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">Kurs moderatsiyasi</h2>
            {pendingCourses && pendingCourses.items.length > 0 && (
              <span className="rounded-full bg-warn-bg px-3 py-1 font-sans text-xs font-semibold text-warn">
                {pendingCourses.items.length} ta kutilmoqda
              </span>
            )}
          </div>
          <p className="mt-1 font-sans text-xs text-ink-soft">
            Ustoz yuborgan yangi kurslarni ko&apos;rib chiqing — nashr eting yoki sababi bilan rad eting.
          </p>
          {pendingCourses === null ? (
            <div className="mt-3">
              <QueueError title="Moderatsiyadagi kurslarni yuklab bo'lmadi." retryHref="/admin" />
            </div>
          ) : pendingCourses.items.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-3">
              {pendingCourses.items.map((c) => (
                <li key={c.id} className="flex flex-col gap-3 rounded-xl border border-line bg-paper p-4">
                  <div className="flex items-start gap-3">
                    <BookIcon width={18} height={18} className="mt-0.5 shrink-0 text-ink-soft" aria-hidden="true" />
                    <div>
                      <p className="font-sans text-base font-medium text-ink">{c.title}</p>
                      <p className="font-sans text-xs text-ink-soft">
                        Ustoz: {c.instructor_name} · {c.students_count} talaba
                      </p>
                    </div>
                  </div>
                  <CourseDecisionButtons courseId={c.id} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3">
              <QueueEmpty
                Icon={BookIcon}
                title="Navbat bo'sh"
                message="Moderatsiya kutayotgan kurs yo'q — barcha kurslar ko'rib chiqilgan."
              />
            </div>
          )}
        </section>

        <section id="nizolar-navbati">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">Nizolar</h2>
            {disputes && disputes.items.length > 0 && (
              <span className="rounded-full bg-error-bg px-3 py-1 font-sans text-xs font-semibold text-error">
                {disputes.items.length} ta ochiq
              </span>
            )}
          </div>
          <p className="mt-1 font-sans text-xs text-ink-soft">
            Buyurtma bo&apos;yicha kelishmovchilik — ijrochi yoki buyurtmachi haq ekanini hal qiling.
          </p>
          {disputes === null ? (
            <div className="mt-3">
              <QueueError title="Nizolarni yuklab bo'lmadi." retryHref="/admin" />
            </div>
          ) : disputes.items.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-3">
              {disputes.items.map((d) => (
                <li key={d.id} className="flex flex-col gap-3 rounded-xl border border-line bg-paper p-4">
                  <div>
                    <p className="font-sans text-base font-semibold text-ink">{d.order_title}</p>
                    <p className="font-sans text-xs text-ink-soft">
                      Buyurtmachi: {d.client_name} · Ijrochi: {d.freelancer_name} ·{' '}
                      {formatThousands(d.amount)} so&apos;m · {formatRelativeTime(d.created_at)}
                    </p>
                    <p className="mt-1.5 font-sans text-sm text-ink">{d.reason}</p>
                  </div>
                  <DisputeResolveButtons orderId={d.order_id} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3">
              <QueueEmpty
                Icon={CheckIcon}
                title="Ochiq nizo yo'q"
                message="Barcha buyurtma nizolari hal qilingan."
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
