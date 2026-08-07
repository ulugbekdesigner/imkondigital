import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getMe } from '@/lib/server-api';
import { getMyCompanies } from '@/lib/employer-api';
import { getRegions } from '@/lib/regions-api';
import { CreateVacancyForm } from '@/components/create-vacancy-form';
import { CabinetPageHeader } from '@/components/cabinet-shell';
import { ArrowLeftIcon, LockIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Yangi vakansiya',
  robots: { index: false },
};

export default async function NewVacancyPage() {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/ish-beruvchi/vakansiyalar/yangi');

  const isEmployer = me.roles.includes('employer') || me.roles.includes('admin');
  if (!isEmployer) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
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

  const companies = await getMyCompanies();
  const company = companies[0];
  if (!company) redirect('/ish-beruvchi');

  const regions = await getRegions();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/ish-beruvchi"
        className="inline-flex items-center gap-1.5 font-sans text-sm text-ink-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        <ArrowLeftIcon width={16} height={16} aria-hidden="true" />
        Boshqaruv paneli
      </Link>

      <div className="mt-3">
        <CabinetPageHeader title="Yangi vakansiya" subtitle={`${company.name} nomidan chop etiladi.`} />
      </div>

      <CreateVacancyForm companyId={company.id} regions={regions} />
    </div>
  );
}
