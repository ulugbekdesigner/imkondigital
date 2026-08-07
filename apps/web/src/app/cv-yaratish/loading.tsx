import { Badge } from '@imkon/ui';
import { EditIcon } from '@/components/shell-icons';
import { AiPanelSkeleton } from '@/components/ai-panel-skeleton';

export default function Loading() {
  return (
    <div className="relative overflow-hidden">
      <div className="relative mx-auto max-w-2xl px-4 py-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mint text-primary">
            <EditIcon width={20} height={20} aria-hidden="true" />
          </span>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">AI yordamchi</p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-ink">CV yaratish</h1>
              <Badge variant="info">AI qoralama</Badge>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <AiPanelSkeleton />
        </div>
      </div>
    </div>
  );
}
