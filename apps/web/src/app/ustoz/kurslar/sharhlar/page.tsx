import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getMe } from '@/lib/server-api';
import { getInstructorReviews } from '@/lib/instructor-studio-api';
import { BecomeInstructorButton } from '@/components/become-instructor-button';
import { CabinetPageHeader } from '@/components/cabinet-shell';
import { CourseReviewsList } from '@/components/course-reviews-list';

export const metadata: Metadata = {
  title: 'Sharhlar — Ustoz kabineti',
  robots: { index: false },
};

export default async function InstructorReviewsPage() {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/ustoz/kurslar/sharhlar');

  if (!me.roles.includes('instructor') && !me.roles.includes('admin')) {
    return (
      <div className="mx-auto max-w-3xl">
        <CabinetPageHeader title="Sharhlar" />
        <BecomeInstructorButton />
      </div>
    );
  }

  const reviews = await getInstructorReviews();
  const unreplied = reviews.filter((r) => !r.instructor_reply).length;
  const averageRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      <CabinetPageHeader
        title="Sharhlar"
        subtitle={
          reviews.length > 0
            ? `Barcha kurslaringiz bo'yicha ${reviews.length} ta sharh${
                averageRating ? `, o'rtacha reyting ${averageRating}` : ''
              }${unreplied > 0 ? `, ${unreplied} tasi javobsiz` : ''}.`
            : undefined
        }
      />
      <CourseReviewsList reviews={reviews} canReply />
    </div>
  );
}
