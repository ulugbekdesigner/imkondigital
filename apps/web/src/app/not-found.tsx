import Link from 'next/link';
import { buttonVariants, cn } from '@imkon/ui';
import { OpenZiyoLink } from '@/components/landing/open-ziyo-link';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-start justify-center gap-4 px-4 py-16 sm:py-24">
      <span className="font-sans text-xs font-bold uppercase tracking-wide text-ink-soft">404</span>
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Bu sahifa topilmadi</h1>
      <p className="font-sans text-base leading-relaxed text-ink-soft">
        Havola eskirgan bo&apos;lishi mumkin. Quyidagilardan birini tanlang.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link href="/" className={buttonVariants({})}>
          Bosh sahifa
        </Link>
        <Link href="/kurslar" className={buttonVariants({ variant: 'outline' })}>
          Kurslar
        </Link>
        <OpenZiyoLink className={cn(buttonVariants({ variant: 'outline' }))}>
          ZIYO&apos;dan so&apos;rash
        </OpenZiyoLink>
      </div>
    </div>
  );
}
