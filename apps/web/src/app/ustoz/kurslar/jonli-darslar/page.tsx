import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getMe } from '@/lib/server-api';
import { getInstructorLiveLessons } from '@/lib/instructor-studio-api';
import { getMyCourses } from '@/lib/courses-api';
import { BecomeInstructorButton } from '@/components/become-instructor-button';
import { CabinetPageHeader } from '@/components/cabinet-shell';
import { LiveLessonManager } from '@/components/live-lesson-manager';

export const metadata: Metadata = {
  title: 'Jonli darslar — Ustoz kabineti',
  robots: { index: false },
};

export default async function InstructorLiveLessonsPage() {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/ustoz/kurslar/jonli-darslar');

  if (!me.roles.includes('instructor') && !me.roles.includes('admin')) {
    return (
      <div className="mx-auto max-w-3xl">
        <CabinetPageHeader title="Jonli darslar" />
        <BecomeInstructorButton />
      </div>
    );
  }

  const [lessons, courses] = await Promise.all([getInstructorLiveLessons(), getMyCourses()]);
  const publishedCourses = courses.filter((c) => c.status === 'published');

  return (
    <div className="mx-auto max-w-3xl">
      <CabinetPageHeader
        title="Jonli darslar"
        subtitle="O'quvchilaringiz uchun Zoom/Google Meet orqali jonli sessiya rejalashtiring."
      />
      <LiveLessonManager courses={publishedCourses} lessons={lessons} />
    </div>
  );
}
