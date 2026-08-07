import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buttonVariants } from '@imkon/ui';
import { CourseGallery } from '@/components/course-gallery';
import { CoursePlayer } from '@/components/course-player';
import { CourseReviewForm } from '@/components/course-review-form';
import { CourseReviewsList } from '@/components/course-reviews-list';
import { ArrowLeftIcon, StarIcon, VideoIcon } from '@/components/shell-icons';
import { getFinalStatus, getMySubmissions } from '@/lib/assessment-api';
import { getCourseReviews } from '@/lib/course-reviews-api';
import {
  getCourse,
  getCourseGallery,
  getCourseLiveLessons,
  getCourseProgress,
} from '@/lib/courses-api';
import { formatDateTime, formatThousands } from '@/lib/format';
import { getMe } from '@/lib/server-api';
import { getAccessToken } from '@/lib/session';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const course = await getCourse(params.slug);
  if (!course) return { title: 'Kurs topilmadi' };
  return {
    title: course.title,
    description: course.description || `${course.title} — IMKON Digital Akademiya kursi.`,
    alternates: { canonical: `/kurslar/${course.slug}` },
  };
}

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
  const course = await getCourse(params.slug);
  if (!course) notFound();

  const authed = Boolean(getAccessToken());
  const [progress, me] = authed
    ? await Promise.all([getCourseProgress(course.id), getMe()])
    : [null, null];
  const [submissions, finalStatus] = progress?.enrolled
    ? await Promise.all([getMySubmissions(course.id), getFinalStatus(course.id)])
    : [[], null];
  const [reviews, gallery, liveLessons] = await Promise.all([
    getCourseReviews(course.id),
    getCourseGallery(course.id),
    getCourseLiveLessons(course.id),
  ]);
  const upcomingLiveLessons = liveLessons.filter((l) => !l.is_past);

  return (
    <>
      {/* Kurs sarlavhasi — quyuq hero. Pleer o'zi (4e-blok) yorug' mustaqil
          birlik sifatida quriladi, shu sabab quyuq zona shu yerda tugaydi. */}
      <div className="bg-deep">
        <header>
          <div className="mx-auto max-w-6xl px-4 pt-8">
            <Link
              href="/kurslar"
              className="inline-flex min-h-touch items-center gap-1.5 rounded-full px-2 font-sans text-sm text-mist hover:bg-deep-fg/10 hover:text-deep-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            >
              <ArrowLeftIcon width={16} height={16} />
              Kurslar katalogi
            </Link>
            {course.status !== 'published' && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-warn-bg px-3 py-1 font-sans text-xs font-semibold text-warn">
                Qoralama ko'rinishi — faqat sizga ko'rinadi, hali chop etilmagan
              </p>
            )}
          </div>

          <div className="mx-auto max-w-6xl px-4 pb-10 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-deep-fg/10 px-2.5 py-0.5 font-mono text-xs text-mist">
                Pog‘ona {course.ladder_step}
              </span>
              {course.is_free ? (
                <span className="rounded-full bg-bright/15 px-2.5 py-0.5 font-mono text-xs font-semibold text-bright">
                  Bepul
                </span>
              ) : (
                <span className="rounded-full bg-deep-fg/10 px-2.5 py-0.5 font-mono text-xs text-mist">
                  {formatThousands(course.price)} so‘m
                </span>
              )}
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold text-deep-fg">{course.title}</h1>
            {course.description && (
              <p className="mt-2 max-w-2xl font-sans text-md text-mist">{course.description}</p>
            )}
            <p className="mt-3 font-sans text-base text-mist">
              Ustoz: {course.instructor_name} · {course.lessons_count} dars
            </p>
          </div>
        </header>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <CoursePlayer
          course={course}
          initialProgress={progress}
          authed={authed}
          initialSubmissions={submissions}
          initialFinalStatus={finalStatus}
          me={me}
        />
      </section>

      {progress?.enrolled && upcomingLiveLessons.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-8">
          <h2 className="flex items-center gap-1.5 font-display text-lg font-semibold text-ink">
            <VideoIcon width={18} height={18} className="text-primary" />
            Jonli darslar
          </h2>
          <ul className="mt-3 flex flex-col gap-2.5">
            {upcomingLiveLessons.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-paper p-4"
              >
                <div>
                  <p className="font-sans text-sm font-semibold text-ink">{l.title}</p>
                  <p className="font-sans text-xs text-ink-soft">{formatDateTime(l.scheduled_at)}</p>
                  {l.description && (
                    <p className="mt-1 font-sans text-sm text-ink-soft">{l.description}</p>
                  )}
                </div>
                <a
                  href={l.meeting_url}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ size: 'sm' })}
                >
                  Qo'shilish
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Ijtimoiy isbot — yorug' zona (mavjud "Oyna" uslubi) */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <CourseGallery items={gallery} />

        <div className="mt-10 border-t border-line pt-8">
          <h2 className="flex items-center gap-1.5 font-display text-lg font-semibold text-ink">
            Sharhlar
            {course.rating > 0 && (
              <span className="inline-flex items-center gap-1 font-sans text-base font-medium text-ink-soft">
                — {course.rating.toFixed(1)}
                <StarIcon width={16} height={16} className="text-primary" />
              </span>
            )}
          </h2>
          {progress?.enrolled && (
            <div className="mt-4 max-w-md">
              <CourseReviewForm courseId={course.id} />
            </div>
          )}
          <div className="mt-4">
            <CourseReviewsList reviews={reviews} />
          </div>
        </div>
      </section>
    </>
  );
}
