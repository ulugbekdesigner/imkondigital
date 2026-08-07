import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getMe } from '@/lib/server-api';
import { getCareerCoachHistory } from '@/lib/ai-api';
import { CareerCoachChat } from '@/components/career-coach-chat';
import { SparkIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Karyera maslahatchisi',
  description: "AI Karyera maslahatchisi — kasb-hunar va martaba bo'yicha shaxsiy yordamchi.",
};

export default async function CareerCoachPage() {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/karyera-kochi');

  const messages = await getCareerCoachHistory();

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-bright/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 py-10">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mint text-primary">
            <SparkIcon width={22} height={22} />
          </span>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">AI yordamchi</p>
            <h1 className="font-display text-2xl font-bold text-ink">Karyera maslahatchisi</h1>
          </div>
        </div>
        <p className="mt-4 font-sans text-base text-ink-soft">
          Kasb-hunar, ko'nikmalarni rivojlantirish va martaba yo'nalishi bo'yicha AI maslahatchi
          bilan suhbatlashing.
        </p>
        <div className="mt-6">
          <CareerCoachChat initialMessages={messages} />
        </div>
      </div>
    </div>
  );
}
