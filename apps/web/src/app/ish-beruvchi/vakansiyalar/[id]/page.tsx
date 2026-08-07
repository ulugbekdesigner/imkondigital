import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getMe } from '@/lib/server-api';
import { getApplicants, getOwnedVacancy } from '@/lib/employer-api';
import { ApplicantsManager } from '@/components/applicants-manager';
import { CabinetPageHeader } from '@/components/cabinet-shell';
import { ArrowLeftIcon, LockIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Nomzodlar',
  robots: { index: false },
};

export default async function VacancyApplicantsPage({ params }: { params: { id: string } }) {
  const me = await getMe();
  if (!me) redirect(`/kirish?next=/ish-beruvchi/vakansiyalar/${params.id}`);

  const isEmployer = me.roles.includes('employer') || me.roles.includes('admin');
  if (!isEmployer) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link
          href="/ish-beruvchi"
          className="inline-flex items-center gap-1.5 font-sans text-sm text-ink-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          <ArrowLeftIcon width={16} height={16} aria-hidden="true" />
          Boshqaruv paneli
        </Link>
        <div className="imk-locked mt-4">
          <LockIcon width={20} height={20} aria-hidden="true" />
          <p className="font-sans text-base">
            Bu bo'lim rolingizga ochiq emas — avval kompaniyangizni ro'yxatdan o'tkazing.
          </p>
        </div>
      </div>
    );
  }

  const vacancyId = Number(params.id);
  const [vacancy, applicants] = await Promise.all([
    getOwnedVacancy(vacancyId),
    getApplicants(vacancyId),
  ]);
  if (!vacancy) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/ish-beruvchi"
        className="inline-flex items-center gap-1.5 font-sans text-sm text-ink-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        <ArrowLeftIcon width={16} height={16} aria-hidden="true" />
        Boshqaruv paneli
      </Link>

      <div className="mt-3">
        <CabinetPageHeader
          title={
            <>
              {vacancy.title} <span className="text-ink-soft">· arizachilar</span>
            </>
          }
          subtitle={
            applicants.length > 0
              ? `${applicants.length} ta ariza · moslik darajasi bo'yicha tartiblangan`
              : "Moslik darajasi bo'yicha tartiblangan — eng mos nomzod tepada."
          }
        />
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-line bg-mint p-4">
        <LockIcon width={18} height={18} className="mt-0.5 shrink-0 text-ink-soft" aria-hidden="true" />
        <p className="font-sans text-sm text-ink-soft">
          <strong className="font-semibold text-ink">Moslashtirilgan sharoit eslatmasi.</strong> Nomzod
          o'z nogironlik guruhi va toifasini ko'rsatishga rozi bo'lsa, u shu ro'yxatda ko'rinadi — suhbatga
          taklif qilishdan oldin zarur moslashtirishlarni muhokama qiling.
        </p>
      </div>

      <div className="mt-6">
        <ApplicantsManager initialApplicants={applicants} />
      </div>
    </div>
  );
}
