import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Badge } from '@imkon/ui';
import { getMe } from '@/lib/server-api';
import { getAdminInstructorDetail } from '@/lib/admin-api';
import { avatarGradient, initialsOf } from '@/lib/avatar';
import { AdminUserActions } from '@/components/admin-user-actions';
import { CourseArchiveButton } from '@/components/course-archive-button';
import { CabinetPageHeader } from '@/components/cabinet-shell';
import { QueueEmpty } from '@/components/admin-queue-states';
import { ArrowLeftIcon, BookIcon, StarIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Ustoz tafsiloti — Admin',
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

const COURSE_STATUS_LABEL: Record<string, string> = {
  draft: 'Qoralama',
  pending: 'Moderatsiyada',
  published: 'Chop etilgan',
  archived: 'Arxivlangan',
};

export default async function AdminInstructorDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const me = await getMe();
  if (!me) redirect(`/kirish?next=/admin/ustozlar/${params.id}`);
  if (!me.roles.includes('admin')) redirect('/admin');

  const instructor = await getAdminInstructorDetail(Number(params.id));
  if (!instructor) notFound();

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/ustozlar"
        className="inline-flex min-h-touch items-center gap-1 font-sans text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      >
        <ArrowLeftIcon width={16} height={16} />
        Barcha ustozlar
      </Link>

      <div className="mt-3 flex items-start gap-4">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-sans text-lg font-bold text-white"
          style={{ background: avatarGradient(instructor.id) }}
        >
          {initialsOf(instructor.full_name)}
        </span>
        <div className="min-w-0 flex-1">
          <CabinetPageHeader
            title={instructor.full_name}
            subtitle={`@${instructor.username} · ${instructor.phone}`}
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={instructor.status === 'active' ? 'success' : 'warn'}>
                  {STATUS_LABEL[instructor.status] ?? instructor.status}
                </Badge>
                {instructor.generosity_tier && (
                  <Badge variant="primary">
                    <StarIcon width={12} height={12} />
                    {GENEROSITY_LABEL[instructor.generosity_tier] ?? instructor.generosity_tier}
                  </Badge>
                )}
                <AdminUserActions
                  userId={instructor.id}
                  fullName={instructor.full_name}
                  status={instructor.status}
                  roles={['instructor']}
                />
              </div>
            }
          />
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold text-ink">Kurslari ({instructor.courses.length})</h2>
        {instructor.courses.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-2">
            {instructor.courses.map((c) => (
              <li key={c.id} className="rounded-[14px] border border-line bg-paper px-4 py-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <BookIcon width={18} height={18} className="shrink-0 text-ink-soft" />
                    <p className="truncate font-sans text-base font-bold text-ink">{c.title}</p>
                    <Badge variant={c.status === 'published' ? 'primary' : 'neutral'}>
                      {COURSE_STATUS_LABEL[c.status] ?? c.status}
                    </Badge>
                    <Badge variant="neutral">{c.is_free ? 'Bepul' : 'Pullik'}</Badge>
                  </div>
                  {c.status === 'published' && <CourseArchiveButton courseId={c.id} />}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-4 font-mono text-xs text-ink-soft">
                  <span>{c.students_count} talaba</span>
                  <span>{c.views_count} ko&apos;rish</span>
                  <span>{c.completion_rate_pct}% tugatish</span>
                  <span className="flex items-center gap-1">
                    <StarIcon width={13} height={13} className="text-primary" />
                    {c.rating.toFixed(1)} ({c.review_count} sharh)
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4">
            <QueueEmpty
              Icon={BookIcon}
              title="Hali kurs yaratmagan"
              message="Bu ustoz hozircha birorta kurs yuklamagan."
              ctaHref="/admin/ustozlar"
              ctaLabel="Barcha ustozlar"
            />
          </div>
        )}
      </section>
    </div>
  );
}
