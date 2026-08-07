import { AiPanelSkeleton } from '@/components/ai-panel-skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <span className="imk-skeleton" style={{ width: 160, height: 16 }} />
      <span className="imk-skeleton mt-4" style={{ width: '50%', height: 12 }} />
      <span className="imk-skeleton mt-2" style={{ width: '70%', height: 26 }} />
      <div className="mt-6">
        <AiPanelSkeleton />
      </div>
    </div>
  );
}
