import { AiPanelSkeleton } from '@/components/ai-panel-skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <span className="imk-skeleton" style={{ width: 140, height: 16 }} />
      <span className="imk-skeleton mt-4" style={{ width: '50%', height: 26 }} />
      <span className="imk-skeleton mt-2" style={{ width: '70%', height: 16 }} />
      <div className="mt-4">
        <AiPanelSkeleton />
      </div>
    </div>
  );
}
