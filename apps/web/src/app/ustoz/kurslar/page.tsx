import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Badge } from '@imkon/ui';
import { getMe } from '@/lib/server-api';
import { getMyCourses } from '@/lib/courses-api';
import { getRegions } from '@/lib/regions-api';
import { BecomeInstructorButton } from '@/components/become-instructor-button';
import { CreateCourseForm } from '@/components/create-course-form';
import { ImpactCertificateButton } from '@/components/impact-certificate-button';
import { CabinetPageHeader } from '@/components/cabinet-shell';
import { BookIcon, ChevronRightIcon, HeartIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Kurslarim',
  robots: { index: false },
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Qoralama',
  pending: 'Moderatsiyada',
  published: 'Chop etilgan',
  archived: 'Arxivlangan',
};

export default async function MyCoursesPage() {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/ustoz/kurslar');

  if (!me.roles.includes('instructor') && !me.roles.includes('admin')) {
    return (
      <div className="max-w-2xl">
        <CabinetPageHeader title="Kurslarim" />
        <BecomeInstructorButton />
      </div>
    );
  }

  const [courses, regions] = await Promise.all([getMyCourses(), getRegions()]);

  return (
    <div className="max-w-3xl">
      <CabinetPageHeader
        title="Kurslarim"
        subtitle={courses.length > 0 ? `${courses.length} ta kurs` : undefined}
        action={
          <Link
            href="/ustoz/kurslar/baholash"
            className="inline-flex min-h-touch items-center gap-1 text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            Baholash navbati
            <ChevronRightIcon width={16} height={16} />
          </Link>
        }
      />

      {courses.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {courses.map((c) => (
            <li key={c.id}>
              <Link
                href={`/ustoz/kurslar/${c.id}`}
                className="flex min-h-touch items-center justify-between gap-3 rounded border border-line px-4 hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
              >
                <span className="font-sans text-base text-ink">{c.title}</span>
                <Badge variant={c.status === 'published' ? 'primary' : 'neutral'}>
                  {STATUS_LABEL[c.status] ?? c.status}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="imk-empty">
          <span className="imk-empty__icon" aria-hidden="true">
            <BookIcon width={26} height={26} />
          </span>
          <p className="font-sans text-base font-medium text-ink">Hali kurs yaratmagansiz</p>
          <p className="max-w-sm font-sans text-sm text-ink-soft">
            Pastdagi formadan birinchi kursingizni yarating.
          </p>
        </div>
      )}

      <section id="yangi-kurs" className="mt-10">
        <h2 className="font-display text-lg font-bold text-ink">Yangi kurs</h2>
        <div className="mt-3 max-w-[480px]">
          <CreateCourseForm regions={regions} />
        </div>
      </section>

      <div className="mt-8 flex flex-col gap-3 rounded-card border border-line bg-mint/40 p-6">
        <div className="flex items-center gap-2">
          <HeartIcon width={20} height={20} className="text-primary" />
          <h2 className="font-display text-lg font-bold text-ink">Saxovat darajasi</h2>
        </div>
        <p className="font-sans text-sm text-ink-soft">
          Bepul kurs bersangiz — ko&apos;proq o&apos;quvchi, ko&apos;proq sharh va obro&apos; yig&apos;asiz, bu esa
          pullik kurslaringizga ham trafik olib keladi (&quot;freemium ustoz strategiyasi&quot;).
          Bepul kurslaringizni tugatgan o&apos;quvchilar soniga qarab &quot;Bronza&quot;, &quot;Kumush&quot; va
          &quot;Oltin&quot; saxovat darajalariga chiqasiz — bu belgi ommaviy Skills Passport
          profilingizda ko&apos;rinadi.
        </p>
        <div>
          <ImpactCertificateButton />
        </div>
      </div>
    </div>
  );
}
