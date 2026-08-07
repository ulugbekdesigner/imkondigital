import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Badge } from '@imkon/ui';
import { getMe } from '@/lib/server-api';
import { getOwnedCourseDetail } from '@/lib/courses-api';
import { CourseConstructor } from '@/components/course-constructor';
import { CourseCertificateTemplatePreview } from '@/components/course-certificate-template-preview';
import { CabinetPageHeader } from '@/components/cabinet-shell';
import { ArrowLeftIcon, ChevronRightIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Kurs konstruktori',
  robots: { index: false },
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Qoralama',
  pending: 'Moderatsiyada',
  published: 'Chop etilgan',
  archived: 'Arxivlangan',
};

export default async function CourseConstructorPage({ params }: { params: { id: string } }) {
  const me = await getMe();
  if (!me) redirect(`/kirish?next=/ustoz/kurslar/${params.id}`);

  const course = await getOwnedCourseDetail(Number(params.id));
  if (!course) notFound();

  const lessonCount = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const subtitle =
    course.modules.length > 0
      ? `${STATUS_LABEL[course.status] ?? course.status} · ${course.modules.length} modul, ${lessonCount} dars · sudrab tartibini o'zgartiring`
      : "Modullarni va darslarni qo'shing, tartibini surib o'zgartiring.";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/ustoz/kurslar"
        className="inline-flex items-center gap-1.5 font-sans text-sm text-ink-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        <ArrowLeftIcon width={16} height={16} aria-hidden="true" />
        Kurslarim
      </Link>

      <div className="mt-3">
        <CabinetPageHeader
          title={course.title}
          subtitle={subtitle}
          action={
            <div className="flex items-center gap-3">
              <Badge variant={course.status === 'published' ? 'primary' : 'neutral'}>
                {STATUS_LABEL[course.status] ?? course.status}
              </Badge>
              <Link
                href={`/ustoz/kurslar/${course.id}/talabalar`}
                className="inline-flex min-h-touch items-center gap-1 font-sans text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
              >
                O'quvchilar va statistika
                <ChevronRightIcon width={16} height={16} aria-hidden="true" />
              </Link>
            </div>
          }
        />
      </div>

      <CourseConstructor course={course} />

      <CourseCertificateTemplatePreview courseTitle={course.title} />
    </div>
  );
}
