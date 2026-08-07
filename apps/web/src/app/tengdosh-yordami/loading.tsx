import { UsersIcon } from '@/components/shell-icons';
import { ListSkeleton } from '@/components/list-skeleton';

export default function Loading() {
  return (
    <div className="relative overflow-hidden">
      <div className="relative mx-auto max-w-2xl px-4 py-10">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mint text-primary">
            <UsersIcon width={20} height={20} aria-hidden="true" />
          </span>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">Qo'llab-quvvatlash</p>
            <h1 className="font-display text-2xl font-bold text-ink">Tengdosh ko'magi</h1>
          </div>
        </div>
        <div className="mt-8">
          <ListSkeleton rows={3} />
        </div>
      </div>
    </div>
  );
}
