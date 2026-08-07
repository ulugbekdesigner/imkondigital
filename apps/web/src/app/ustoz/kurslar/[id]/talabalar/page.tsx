import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getMe } from '@/lib/server-api';
import { getOwnedCourseDetail } from '@/lib/courses-api';
import { getCourseStats, getCourseStudents } from '@/lib/instructor-studio-api';
import { getCourseReviews } from '@/lib/course-reviews-api';
import { CourseStatsCard } from '@/components/course-stats-card';
import { CourseStudentsList } from '@/components/course-students-list';
import { CourseReviewsList } from '@/components/course-reviews-list';
import { CabinetPageHeader } from '@/components/cabinet-shell';
import { ArrowLeftIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: "O'quvchilar va statistika",
  robots: { index: false },
};

export default async function CourseStudentsPage({ params }: { params: { id: string } }) {
  const me = await getMe();
  if (!me) redirect(`/kirish?next=/ustoz/kurslar/${params.id}/talabalar`);

  const courseId = Number(params.id);
  const course = await getOwnedCourseDetail(courseId);
  if (!course) notFound();

  const [stats, students, reviews] = await Promise.all([
    getCourseStats(courseId),
    getCourseStudents(courseId),
    getCourseReviews(courseId),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href={`/ustoz/kurslar/${courseId}`}
        className="inline-flex items-center gap-1.5 font-sans text-sm text-ink-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        <ArrowLeftIcon width={16} height={16} aria-hidden="true" />
        Kurs konstruktoriga qaytish
      </Link>

      <div className="mt-3">
        <CabinetPageHeader title={course.title} subtitle="O'quvchilar va statistika" />
      </div>

      {stats && <CourseStatsCard stats={stats} />}

      <section className="mt-8">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-semibold text-ink">O'quvchilar</h2>
          <span className="rounded-full bg-mint px-2 py-0.5 font-mono text-xs text-ink-soft">
            {students.length}
          </span>
        </div>
        <div className="mt-3">
          <CourseStudentsList courseId={courseId} students={students} />
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-semibold text-ink">Fikrlar markazi</h2>
          <span className="rounded-full bg-mint px-2 py-0.5 font-mono text-xs text-ink-soft">
            {reviews.length}
          </span>
        </div>
        <div className="mt-3">
          <CourseReviewsList reviews={reviews} canReply />
        </div>
      </section>
    </div>
  );
}
