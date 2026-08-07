import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getMe } from '@/lib/server-api';
import { getPeerSupportRooms } from '@/lib/peer-support-api';
import { ChevronRightIcon, UsersIcon } from '@/components/shell-icons';

export const metadata: Metadata = {
  title: 'Tengdosh ko\'magi',
  description: "Yo'lni bosib o'tganlar bilan tajriba almashing — real odamlar, real suhbat.",
};

export default async function PeerSupportRoomsPage() {
  const me = await getMe();
  if (!me) redirect('/kirish?next=/tengdosh-yordami');

  const rooms = await getPeerSupportRooms();

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-bright/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 py-10">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mint text-primary">
            <UsersIcon width={20} height={20} />
          </span>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">Qo'llab-quvvatlash</p>
            <h1 className="font-display text-2xl font-bold text-ink">Tengdosh ko'magi</h1>
          </div>
        </div>
        <p className="mt-4 font-sans text-base text-ink-soft">
          Yo'lni bosib o'tgan yoki hozir siz bilan bir bosqichda bo'lgan odamlar bilan real
          suhbat — "men ham shu yerda edim" degan tuyg'u.
        </p>

        {rooms.length > 0 ? (
          <ul className="mt-8 flex flex-col gap-3">
            {rooms.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/tengdosh-yordami/${r.id}`}
                  className="group flex min-h-touch items-center justify-between gap-3 rounded-xl border border-line bg-paper px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-sans text-base font-medium text-ink">
                      {r.title}
                    </span>
                    <span className="truncate font-sans text-xs text-ink-soft">
                      {r.description}
                    </span>
                  </span>
                  <ChevronRightIcon
                    width={18}
                    height={18}
                    className="shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-line bg-mint/40 p-8 text-center">
            <h2 className="font-display text-lg font-bold text-ink">Hozircha davra yo'q</h2>
          </div>
        )}
      </div>
    </div>
  );
}
